import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { convertToTitleCase, getDataValue, setDataValue } from '../utils'
import { Provider, Team, User } from '../data/model/caseload'

export const getDefaultUser = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, id } = req.params
    const { username } = res.locals.user
    const { data } = req.session
    // eslint-disable-next-line no-useless-escape
    const regexIgnoreValuesInParentheses = /[\(\)]/
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)
    let attendingUsername = getDataValue(data, ['appointments', crn, id, 'user', 'username']) ?? null
    let providerCode = getDataValue(data, ['appointments', crn, id, 'user', 'providerCode']) ?? null
    let teamCode = getDataValue(data, ['appointments', crn, id, 'user', 'teamCode']) ?? null

    const getTeamsAndStaff = async (provider: string, team: string): Promise<[Team[], User[]]> => {
      const [{ teams }, { users }] = await Promise.all([
        masClient.getTeamsByProvider(provider),
        masClient.getStaffByTeam(team),
      ])
      return [teams, users]
    }

    if (!attendingUsername || !providerCode || !teamCode) {
      const [{ defaultUserDetails, providers, teams, users }, probationPractitioner] = await Promise.all([
        masClient.getUserProviders(username),
        masClient.getProbationPractitioner(crn),
      ])
      let sessionProviders: Provider[] = []
      let sessionTeams: Team[] = []
      let sessionStaff: User[] = []
      if (probationPractitioner.unallocated === false) {
        attendingUsername = probationPractitioner.username
        providerCode = probationPractitioner.provider.code
        teamCode = probationPractitioner.team.code
        sessionProviders = [probationPractitioner.provider]
        sessionTeams = [probationPractitioner.team]
        const nameAndRole =
          users.find(user => user.username.toLowerCase() === probationPractitioner.username.toLowerCase())
            ?.nameAndRole ?? `${probationPractitioner.name.forename} ${probationPractitioner.name.surname}`
        sessionStaff = [
          {
            staffCode: probationPractitioner.code,
            username: probationPractitioner.username,
            nameAndRole: convertToTitleCase(nameAndRole, [], regexIgnoreValuesInParentheses),
          },
        ]
        sessionProviders = providers.some(provider => provider.code === probationPractitioner.provider.code)
          ? providers
          : [...providers, probationPractitioner.provider]
        ;[sessionTeams, sessionStaff] = await getTeamsAndStaff(
          probationPractitioner.provider.code,
          probationPractitioner.team.code,
        )
      } else {
        attendingUsername = defaultUserDetails.username
        providerCode = providers.find(provider => provider.name === defaultUserDetails.homeArea)?.code
        teamCode = teams.find(team => team.description === defaultUserDetails.team)?.code
        sessionProviders = providers
        ;[sessionTeams, sessionStaff] = await getTeamsAndStaff(providerCode, teamCode)
      }
      setDataValue(data, ['appointments', crn, id, 'user', 'providerCode'], providerCode)
      setDataValue(data, ['appointments', crn, id, 'user', 'teamCode'], teamCode)
      setDataValue(data, ['appointments', crn, id, 'user', 'username'], attendingUsername)
      setDataValue(data, ['providers', username], sessionProviders)
      setDataValue(data, ['teams', username], sessionTeams)
      setDataValue(data, ['staff', username], sessionStaff)
    }
    return next()
  }
}
