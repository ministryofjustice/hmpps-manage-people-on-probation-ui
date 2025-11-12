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

    const { defaultUserDetails, providers } = await masClient.getUserProviders(username)
    const {
      providerCode: providerCodeSession,
      teamCode: teamCodeSession,
      username: usernameSession,
    } = getDataValue(data, ['appointments', crn, id, 'user'])

    const defaultProvider = providers.find(
      provider => provider.name.toLowerCase() === defaultUserDetails.homeArea.toLowerCase(),
    )?.code

    const probationPractitioner = await masClient.getProbationPractitioner(crn)

    let selectedProvider: string = providerCodeQuery ?? providerCodeSession ?? defaultProvider
    if (selectedProvider === probationPractitioner.provider.code) {
      selectedProvider = defaultProvider
    }
    const { teams } = await masClient.getTeamsByProvider(selectedProvider)
    const defaultTeam = teams.find(
      team => team.description.toLowerCase() === defaultUserDetails.team.toLowerCase(),
    )?.code

    let selectedTeam = teamCodeQuery ?? teamCodeSession ?? defaultTeam

    if (selectedTeam === probationPractitioner.team.code) {
      selectedTeam = defaultTeam
    }

    if (providerCodeQuery && !teamCodeQuery) {
      selectedTeam = teams[0].code
    }

    let selectedUser = usernameSession ?? defaultUserDetails.username

    if (selectedUser.toLowerCase() === probationPractitioner.username.toLowerCase()) {
      selectedUser = defaultUserDetails.username
    }

    if (selectedProvider === probationPractitioner.provider.code) {
      selectedProvider = defaultProvider
      selectedTeam = defaultTeam
      selectedUser = defaultUserDetails.username
    }

    const { users } = await masClient.getStaffByTeam(selectedTeam)

    if (providerCodeQuery) {
      selectedUser = users[0].username
    }

    const providerOptions = providers.map(provider => {
      const { code, name } = provider
      const option: Provider = { code, name }
      if (code === selectedProvider) {
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

    res.locals.userProviders = providerOptions
    res.locals.userTeams = teamOptions
    res.locals.userStaff = userOptions
    res.locals.providerCode = selectedProvider
    res.locals.teamCode = selectedTeam
    return next()
  }
}
