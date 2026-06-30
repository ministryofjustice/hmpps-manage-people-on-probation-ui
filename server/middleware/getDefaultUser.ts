import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { convertToTitleCase, getDataValue, setDataValue } from '../utils'
import { Team, User } from '../data/model/caseload'
import { Name } from '../data/model/personalDetails'

export const getDefaultUser = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void | null>> => {
  return async (req, res, next) => {
    const { crn, id } = req.params as Record<string, string>
    const { username } = res.locals.user
    const { data } = req.session
    // eslint-disable-next-line no-useless-escape
    const regexIgnoreValuesInParentheses = /[\(\)]/
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)

    const getTeamsAndStaff = async (
      providerCode: string,
      teamCode: string,
    ): Promise<{ teams: Team[]; users: User[] }> => {
      const [{ teams }, { users }] = await Promise.all([
        masClient.getTeamsByProvider(providerCode),
        masClient.getStaffByTeam(teamCode),
      ])
      return { teams, users }
    }

    let attendingUsername = getDataValue<string>(data, ['appointments', crn, id, 'user', 'username']) ?? null
    let attendingEmail: string
    let attendingName: Name
    if (res.locals.flags.enableMAN2344) {
      attendingEmail = getDataValue<string>(data, ['appointments', crn, id, 'user', 'email']) ?? null
      attendingName = getDataValue<Name>(data, ['appointments', crn, id, 'user', 'name']) ?? null
    }
    let providerCode = getDataValue(data, ['appointments', crn, id, 'user', 'providerCode']) ?? null
    let teamCode = getDataValue(data, ['appointments', crn, id, 'user', 'teamCode']) ?? null
    const [{ defaultUserDetails, providers, teams, users }, probationPractitioner] = await Promise.all([
      masClient.getUserProviders(username),
      masClient.getProbationPractitioner(crn),
    ])
    let sessionProviders = providers
    let sessionTeams: Team[] = []
    let sessionStaff: User[] = []

    if (!providerCode || !teamCode || !attendingUsername) {
      sessionTeams = teams
      sessionStaff = users
      if (probationPractitioner.unallocated === false) {
        attendingUsername = probationPractitioner.username
        if (res.locals.flags.enableMAN2344) {
          attendingEmail = probationPractitioner.email
          attendingName = probationPractitioner.name
        }
        providerCode = probationPractitioner.provider.code
        teamCode = probationPractitioner.team.code
      } else {
        attendingUsername = defaultUserDetails?.username
        if (res.locals.flags.enableMAN2344) {
          attendingEmail = defaultUserDetails?.email
          attendingName = defaultUserDetails.name
        }
        providerCode = providers.find(provider => provider.name === defaultUserDetails.homeArea)?.code
        teamCode = teams.find(team => team.description === defaultUserDetails.team)?.code
      }
      setDataValue(data, ['appointments', crn, id, 'user', 'providerCode'], providerCode)
      setDataValue(data, ['appointments', crn, id, 'user', 'teamCode'], teamCode)
      setDataValue(data, ['appointments', crn, id, 'user', 'username'], attendingUsername)
      if (res.locals.flags.enableMAN2344) {
        setDataValue(data, ['appointments', crn, id, 'user', 'email'], attendingEmail)
        setDataValue(data, ['appointments', crn, id, 'user', 'name'], attendingName)
      }
      const appointmentStaff = await masClient.getStaffByTeam(teamCode)
      const ppStaff = appointmentStaff.users.find(
        user => user?.username?.toLowerCase() === probationPractitioner?.username?.toLowerCase(),
      )
      if (ppStaff && !sessionStaff.some(u => u?.username?.toLowerCase() === ppStaff.username?.toLowerCase())) {
        sessionStaff.push(ppStaff)
      }
    } else {
      const { teams: providerTeams, users: providerStaff } = await getTeamsAndStaff(providerCode, teamCode)
      sessionProviders = getDataValue(data, ['providers', username]) ?? sessionProviders
      sessionTeams = getDataValue(data, ['teams', username]) ?? providerTeams
      sessionStaff = getDataValue(data, ['staff', username]) ?? providerStaff
    }
    if (attendingUsername?.toLowerCase() === probationPractitioner?.username?.toLowerCase()) {
      if (!sessionProviders.some(provider => provider.code === probationPractitioner.provider.code)) {
        sessionProviders = [...sessionProviders, probationPractitioner.provider]
      }
      if (!sessionTeams.some(team => team.code === probationPractitioner.team.code)) {
        sessionTeams = [...sessionTeams, probationPractitioner.team]
      }
      if (
        !sessionStaff.some(user => user?.username?.toLowerCase() === probationPractitioner?.username?.toLowerCase())
      ) {
        const nameAndRole = convertToTitleCase(
          `${probationPractitioner.name.forename} ${probationPractitioner.name.surname}`,
          [],
          regexIgnoreValuesInParentheses,
        )
        let sessionStaffItem: User = {
          staffCode: probationPractitioner.code,
          username: probationPractitioner.username,
          nameAndRole,
        }
        if (res.locals.flags.enableMAN2344) {
          sessionStaffItem = {
            ...sessionStaffItem,
            name: probationPractitioner.name,
            email: probationPractitioner.email,
          }
        }
        sessionStaff = [...sessionStaff, sessionStaffItem]
      }
    }
    setDataValue(data, ['providers', username], sessionProviders)
    setDataValue(data, ['teams', username], sessionTeams)
    setDataValue(data, ['staff', username], sessionStaff)
    return next()
  }
}
