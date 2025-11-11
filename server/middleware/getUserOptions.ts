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

    let { providers: userProviders } = await masClient.getUserProviders(username)
    const {
      username: usernameSession,
      providerCode: providerCodeSession,
      teamCode: teamCodeSession,
    } = getDataValue(data, ['appointments', crn, id, 'user'])

    const selectedProvider: string = providerCodeQuery ?? providerCodeSession ?? userProviders[0].code

    let { teams } = await masClient.getTeamsByProvider(selectedProvider)

    let selectedTeam = teamCodeQuery ?? teamCodeSession ?? teams[0].code

    let { users } = await masClient.getStaffByTeam(selectedTeam)

    let selectedUser = !providerCodeQuery && !teamCodeQuery && usernameSession ? usernameSession : users[0].username

    const probationPractitioner = await masClient.getProbationPractitioner(crn)

    const userHasPractitionerProviderAccess = userProviders.some(
      provider => provider.code === probationPractitioner.provider.code,
    )

    if (probationPractitioner.unallocated === false) {
      if (!userProviders.some(provider => provider.code === probationPractitioner.provider.code)) {
        userProviders = [...userProviders, probationPractitioner.provider]
      }
      if (
        !teams.some(team => team.code === probationPractitioner.team.code) &&
        selectedProvider === probationPractitioner.provider.code
      ) {
        teams = [...teams, probationPractitioner.team]
      }
      if (
        !users.some(user => user.username.toLowerCase() === probationPractitioner.username.toLowerCase()) &&
        selectedProvider === probationPractitioner.provider.code
      ) {
        const {
          code: staffCode,
          username: ppUsername,
          name: { forename, surname },
        } = probationPractitioner
        users = [
          ...users,
          { staffCode, username: ppUsername, nameAndRole: convertToTitleCase(`${forename} ${surname}`) },
        ]
      }

      req.session.data = {
        ...(req?.session?.data ?? {}),
        providers: {
          ...(req?.session?.data?.providers ?? {}),
          [username]: userProviders,
        },
        teams: {
          ...(req?.session?.data?.teams ?? {}),
          [username]: teams,
        },
        staff: {
          ...(req?.session?.data?.staff ?? {}),
          [username]: users.map(user => ({
            ...user,
            nameAndRole: convertToTitleCase(user.nameAndRole, [], regexIgnoreValuesInParentheses),
          })),
        },
      }
    }

    if (selectedProvider === probationPractitioner.provider.code && !userHasPractitionerProviderAccess) {
      teams = [{ ...probationPractitioner.team }]
      const {
        code: staffCode,
        username: ppUsername,
        name: { forename, surname },
      } = probationPractitioner
      users = [{ staffCode, username: ppUsername, nameAndRole: `${forename} ${surname}` }]
      selectedTeam = probationPractitioner.team.code
      selectedUser = probationPractitioner.username
    }

    const providerOptions = userProviders.map(provider => {
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
