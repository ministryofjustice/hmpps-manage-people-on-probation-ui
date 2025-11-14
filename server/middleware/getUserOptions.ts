import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { Provider, Team, User } from '../data/model/caseload'
import { convertToTitleCase, getDataValue } from '../utils'

export const getUserOptions = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { username } = res.locals.user
    const { crn, id } = req.params
    const { providerCode: providerCodeQuery, teamCode: teamCodeQuery, back } = req.query as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)
    const { data } = req.session
    // eslint-disable-next-line no-useless-escape
    const regexIgnoreValuesInParentheses = /[\(\)]/

    const [{ defaultUserDetails, providers, teams: defaultTeams }, probationPractitioner] = await Promise.all([
      masClient.getUserProviders(username),
      masClient.getProbationPractitioner(crn),
    ])

    const providerCodeSession = getDataValue(data, ['appointments', crn, id, 'user', 'providerCode'])
    const teamCodeSession = getDataValue(data, ['appointments', crn, id, 'user', 'teamCode'])
    const usernameSession = getDataValue(data, ['appointments', crn, id, 'user', 'username'])

    const defaultProvider = providers.find(
      provider => provider.name.toLowerCase() === defaultUserDetails.homeArea.toLowerCase(),
    )?.code

    let selectedProvider: string = providerCodeQuery ?? providerCodeSession ?? defaultProvider
    if (selectedProvider === probationPractitioner.provider.code) {
      selectedProvider = defaultProvider
    }

    const { teams } = await masClient.getTeamsByProvider(selectedProvider)

    const defaultTeam = defaultTeams.find(
      team => team.description.toLowerCase() === defaultUserDetails.team.toLowerCase(),
    )?.code

    let selectedTeam = teamCodeQuery ?? teamCodeSession
    if (selectedTeam === probationPractitioner.team.code) {
      selectedTeam = defaultTeam
    }
    if (!selectedTeam) {
      if (selectedProvider === defaultProvider) {
        selectedTeam = defaultTeam
      } else {
        selectedTeam = teams[0].code
      }
    }

    const { users } = await masClient.getStaffByTeam(selectedTeam)

    let selectedUser = usernameSession ?? defaultUserDetails.username ?? users[0].username

    if (selectedUser.toLowerCase() === probationPractitioner.username.toLowerCase()) {
      selectedUser = defaultUserDetails.username
    }

    let providerOptions = providers.map(provider => {
      const { code, name } = provider
      const option: Provider = { code, name }
      if (code === selectedProvider) {
        option.selected = 'selected'
      }
      return option
    })

    providerOptions = providerOptions.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

    let teamOptions = teams.map(team => {
      const { code, description } = team
      const option: Team = { code, description }
      if (code === selectedTeam) {
        option.selected = 'selected'
      }
      return option
    })

    teamOptions = teamOptions.sort((a, b) =>
      a.description.localeCompare(b.description, undefined, { sensitivity: 'base' }),
    )

    let userOptions = users.map(user => {
      const { username: staffUsername, nameAndRole, staffCode } = user
      const option: User = {
        username: staffUsername,
        nameAndRole: convertToTitleCase(nameAndRole, [], regexIgnoreValuesInParentheses),
        staffCode,
      }
      if (staffUsername.toLowerCase() === selectedUser.toLowerCase()) {
        option.selected = 'selected'
      }
      return option
    })

    userOptions = userOptions.sort((a, b) =>
      a.nameAndRole.localeCompare(b.nameAndRole, undefined, { sensitivity: 'base' }),
    )

    res.locals.userProviders = providerOptions
    res.locals.userTeams = teamOptions
    res.locals.userStaff = userOptions
    res.locals.providerCode = selectedProvider
    res.locals.teamCode = selectedTeam
    return next()
  }
}
