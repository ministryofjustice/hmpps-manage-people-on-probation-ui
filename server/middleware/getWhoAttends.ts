import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { DefaultUserDetails, Provider, Team, User } from '../data/model/caseload'
import { convertToTitleCase, getDataValue, setDataValue } from '../utils'
import { AppointmentSessionUser } from '../models/Appointments'

export const getWhoAttends = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { username } = res.locals.user
    const { crn, id } = req.params
    const { providerCode: providerCodeQuery, teamCode: teamCodeQuery, back } = req.query as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)
    const { data } = req.session
    // eslint-disable-next-line no-useless-escape
    const regexIgnoreValuesInParentheses = /[\(\)]/

    const [{ defaultUserDetails, providers: userProviders }, probationPractitioner] = await Promise.all([
      masClient.getUserProviders(username),
      masClient.getProbationPractitioner(crn),
    ])
    const hasAllocatedPractitioner = probationPractitioner?.unallocated === false
    let providers = userProviders
    let selectedRegion = providerCodeQuery ?? getDataValue(data, ['appointments', crn, id, 'user', 'providerCode'])
    let selectedTeam = teamCodeQuery ?? getDataValue(data, ['appointments', crn, id, 'user', 'teamCode'])
    let selectedUser = getDataValue(data, ['appointments', crn, id, 'user', 'username'])

    let { teams } = await masClient.getTeamsByProvider(selectedRegion)

    const practitionerTeamFound = teams.some(team => team.code === probationPractitioner.team.code)

    if (!selectedRegion) {
      selectedRegion =
        hasAllocatedPractitioner && practitionerTeamFound
          ? probationPractitioner.provider.code
          : providers.find(provider => provider.name.toLowerCase() === defaultUserDetails.homeArea.toLowerCase())?.code
    }

    if (!selectedTeam) {
      selectedTeam =
        hasAllocatedPractitioner && practitionerTeamFound
          ? probationPractitioner.team.code
          : teams.find(team => team.description.toLowerCase() === defaultUserDetails.team.toLowerCase())?.code
    }

    let { users } = await masClient.getStaffByTeam(selectedTeam)

    if (
      hasAllocatedPractitioner &&
      !providers.some(provider => provider.code === probationPractitioner.provider.code)
    ) {
      const { code, name } = probationPractitioner.provider
      providers = [...providers, { code, name }]
    }
    if (hasAllocatedPractitioner && !teams.some(team => team.code === probationPractitioner.team.code)) {
      const { description, code } = probationPractitioner.team
      teams = [...teams, { description, code }]
    }
    if (
      hasAllocatedPractitioner &&
      !users.some(user => user.username.toLowerCase() === probationPractitioner.username.toLowerCase())
    ) {
      users = [
        ...users,
        {
          staffCode: probationPractitioner.code,
          username: probationPractitioner.username,
          nameAndRole: convertToTitleCase(
            `${probationPractitioner.name.forename} ${probationPractitioner.name.surname}`,
            [],
            regexIgnoreValuesInParentheses,
          ),
        },
      ]
    }

    if (!selectedUser) {
      selectedUser =
        hasAllocatedPractitioner && practitionerTeamFound ? probationPractitioner.username : defaultUserDetails.username
    }

    const attendingUserInSession: AppointmentSessionUser = getDataValue(data, ['appointments', crn, id, 'user'])

    let attendingUser: DefaultUserDetails

    if (attendingUserInSession?.username) {
      let homeArea = providers.find(provider => provider.code === attendingUserInSession?.providerCode)?.name
      if (!homeArea && attendingUserInSession.providerCode === probationPractitioner.provider.code) {
        homeArea = probationPractitioner.provider.name
      }
      let teamName = teams.find(team => team.code === attendingUserInSession?.teamCode)?.description
      if (!teamName && attendingUserInSession.teamCode === probationPractitioner.team.code) {
        teamName = probationPractitioner.team.description
      }
      attendingUser = {
        staffCode: users.find(user => user?.username?.toLowerCase() === attendingUserInSession?.username?.toLowerCase())
          ?.username,
        username: attendingUserInSession?.username,
        homeArea,
        team: teamName,
      }
    }
    if (!attendingUserInSession?.username) {
      let providerCode = null
      let teamCode = null
      if (!hasAllocatedPractitioner) {
        attendingUser = defaultUserDetails
      } else {
        attendingUser = {
          staffCode: probationPractitioner.code,
          username: probationPractitioner?.username,
          homeArea: probationPractitioner.provider.name,
          team: probationPractitioner.team.description,
        }
        providerCode = probationPractitioner.provider.code
        teamCode = probationPractitioner.team.code
      }
      setDataValue(
        data,
        ['appointments', crn, id, 'user', 'providerCode'],
        providerCode ?? providers.find(provider => provider.name === attendingUser.homeArea)?.code,
      )
      setDataValue(
        data,
        ['appointments', crn, id, 'user', 'teamCode'],
        teamCode ?? teams.find(team => team.description === attendingUser.team)?.code,
      )
      setDataValue(data, ['appointments', crn, id, 'user', 'username'], attendingUser.username)
    }

    const providerOptions = providers.map(provider => {
      const { code, name } = provider
      const option: Provider = { code, name }
      if (code === selectedRegion) {
        option.selected = 'selected'
      }
      return option
    })

    const teamOptions = teams.map(team => {
      const { code, description } = team
      const option: Team = { code, description }
      if (code === selectedTeam) {
        option.selected = 'selected'
      }
      return option
    })

    const userOptions = users.map(user => {
      const { username: staffUsername, nameAndRole } = user
      const option: User = {
        username: staffUsername,
        nameAndRole: convertToTitleCase(nameAndRole, [], regexIgnoreValuesInParentheses),
      }
      if (staffUsername.toLowerCase() === selectedUser.toLowerCase()) {
        option.selected = 'selected'
      }
      return option
    })

    req.session.data = {
      ...(req?.session?.data ?? {}),
      providers: {
        ...(req?.session?.data?.providers ?? {}),
        [username]: providers,
      },
      teams: {
        ...(req?.session?.data?.teams ?? {}),
        [username]: teams,
      },
      staff: {
        ...(req?.session?.data?.staff ?? {}),
        [username]: users,
      },
    }

    res.locals.userProviders = providerOptions
    res.locals.userTeams = teamOptions
    res.locals.userStaff = userOptions
    res.locals.attendingUser = attendingUser
    res.locals.providerCode = selectedRegion
    res.locals.teamCode = selectedTeam
    return next()
  }
}
