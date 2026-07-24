import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { Provider, Team, User } from '../data/model/caseload'
import { convertToTitleCase, getDataValue, setDataValue } from '../utils'
import { logSessionCacheChange } from '../utils/logSessionCacheChange'
import logger from '../../logger'

export const getUserOptions = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function getUserOptionsInner(req, res, next?) {
    const { username } = res.locals.user
    const { crn, id } = req.params as Record<string, string>
    const { providerCode: providerCodeQuery, teamCode: teamCodeQuery, back } = req.query as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)
    const { data } = req.session

    const sessionCacheContext = {
      uuid: id,
      username,
      crn,
      enabled: res.locals.flags.enableSessionCacheLogging,
    }
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
    logSessionCacheChange(
      'getUserOptions.selectedProvider',
      data,
      ['appointments', crn, id, 'user', 'providerCode'],
      selectedProvider,
      sessionCacheContext,
    )

    const { teams } = await masClient.getTeamsByProvider(selectedProvider)

    const defaultTeam = defaultTeams.find(
      team => team.description.toLowerCase() === defaultUserDetails?.team?.toLowerCase(),
    )?.code

    let selectedTeam = teamCodeQuery ?? teamCodeQuery
    if (selectedTeam === probationPractitioner.team.code) {
      selectedTeam = defaultTeam ?? teams[0].code
    }
    if (!providerCodeQuery) {
      if (selectedProvider === defaultProvider) {
        selectedTeam = defaultTeam ?? teams[0].code
      } else {
        selectedTeam = teamCodeSession ?? teams[0].code
      }
    }
    if (providerCodeQuery && !teamCodeQuery) {
      selectedTeam = teams[0].code
    }
    logSessionCacheChange(
      'getUserOptions.selectedTeam',
      data,
      ['appointments', crn, id, 'user', 'teamCode'],
      selectedTeam,
      sessionCacheContext,
    )

    const { users } = await masClient.getStaffByTeam(selectedTeam)

    let selectedUser = usernameSession ?? users[0].username
    if (teamCodeQuery) {
      selectedUser = users[0].username
    }

    if (selectedUser?.toLowerCase() === probationPractitioner?.username?.toLowerCase()) {
      selectedUser = defaultUserDetails.username
    }
    logSessionCacheChange(
      'getUserOptions.selectedUser',
      data,
      ['appointments', crn, id, 'user', 'username'],
      selectedUser,
      sessionCacheContext,
    )

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
      if (res.locals.flags.enableMAN2344) {
        const { username: staffUsername, nameAndRole, staffCode, email, name } = user
        const option: User = {
          username: staffUsername,
          nameAndRole: convertToTitleCase(nameAndRole, [], regexIgnoreValuesInParentheses),
          staffCode,
          email,
          name,
        }
        if (staffUsername.toLowerCase() === selectedUser.toLowerCase()) {
          option.selected = 'selected'
        }
        return option
      }
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
    logger.info(`[getUserOptions] uuid='${id}' username='${username}' calledWithNext=${Boolean(next)}`)
    logSessionCacheChange('getUserOptions', data, ['providers', username], providerOptions, sessionCacheContext)
    logSessionCacheChange('getUserOptions', data, ['teams', username], teamOptions, sessionCacheContext)
    logSessionCacheChange('getUserOptions', data, ['staff', username], userOptions, sessionCacheContext)
    setDataValue(data, ['providers', username], providerOptions)
    setDataValue(data, ['teams', username], teamOptions)
    setDataValue(data, ['staff', username], userOptions)
    if (!next) {
      return null
    }
    return next()
  }
}
