import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { DefaultUserDetails, Provider, Team, User } from '../data/model/caseload'
import { convertToTitleCase, getDataValue, setDataValue } from '../utils'
import { logSessionCacheChange } from '../utils/logSessionCacheChange'
import logger from '../../logger'

export const getUserOptions = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function getUserOptionsInner(req, res, next?) {
    const { username } = res.locals.user
    const { crn, id } = req.params as Record<string, string>
    const { providerCode: providerCodeQuery, teamCode: teamCodeQuery } = req.query as Record<string, string>
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

    let selectedTeam = ''
    let selectedUser = ''
    const providerCodeSession = getDataValue(data, ['appointments', crn, id, 'user', 'providerCode']) || ''
    const teamCodeSession = getDataValue(data, ['appointments', crn, id, 'user', 'teamCode']) || ''
    const usernameSession = getDataValue(data, ['appointments', crn, id, 'user', 'username']) || ''

    let defaultUserDetails: DefaultUserDetails
    let providers: Provider[]
    let defaultTeams: Team[]

    const probationPractitioner = await masClient.getProbationPractitioner(crn)
    let useProbationPractitioner = true
    if (probationPractitioner.unallocated === false) {
      const userProvidersForPPTeam = await masClient.getUserProviders(
        username,
        probationPractitioner.provider.code,
        probationPractitioner.team.code,
      )
      const isAccessible = userProvidersForPPTeam.users.find(user => user?.username === probationPractitioner?.username)
      if (isAccessible) {
        defaultUserDetails = {
          ...isAccessible,
          homeArea: probationPractitioner.provider.name,
          team: probationPractitioner.team.description,
        } as DefaultUserDetails
        providers = userProvidersForPPTeam.providers
        defaultTeams = userProvidersForPPTeam.teams
      } else {
        useProbationPractitioner = false
      }
    } else {
      useProbationPractitioner = false
    }

    if (!useProbationPractitioner) {
      const userProviders = await masClient.getUserProviders(username)
      defaultUserDetails = userProviders.defaultUserDetails
      providers = userProviders.providers
      defaultTeams = userProviders.teams
    }

    let providerOptions = providers.map(provider => {
      const { code, name } = provider
      const option: Provider = { code, name }
      return option
    })

    providerOptions = providerOptions.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

    const defaultProvider =
      providers.find(provider => provider.name.toLowerCase() === defaultUserDetails.homeArea.toLowerCase())?.code || ''

    let selectedProvider = providerCodeQuery || providerCodeSession || defaultProvider || providerOptions?.[0]?.code

    if (!providerCodeQuery && providerCodeSession && providerCodeSession === probationPractitioner.provider.code) {
      selectedProvider = defaultProvider
    }

    providerOptions = providerOptions.map(({ code, name }) => {
      const option: Provider = { code, name }
      if (code === selectedProvider) {
        option.selected = 'selected'
      }
      return option
    })

    logSessionCacheChange(
      'getUserOptions.selectedProvider',
      data,
      ['appointments', crn, id, 'user', 'providerCode'],
      selectedProvider,
      sessionCacheContext,
    )

    const { teams } = await masClient.getTeamsByProvider(selectedProvider)

    let teamOptions = teams.map(team => {
      const { code, description } = team
      const option: Team = { code, description }
      return option
    })

    teamOptions = teamOptions.sort((a, b) =>
      a.description.localeCompare(b.description, undefined, { sensitivity: 'base' }),
    )

    const defaultTeam =
      defaultTeams.find(team => team.description.toLowerCase() === defaultUserDetails?.team?.toLowerCase())?.code || ''

    if (teamCodeQuery) {
      selectedTeam = teamCodeQuery
    } else if (!providerCodeQuery) {
      selectedTeam = teamCodeSession || defaultTeam
    }

    if (
      !providerCodeQuery &&
      !teamCodeQuery &&
      teamCodeSession &&
      teamCodeSession === probationPractitioner.team.code
    ) {
      selectedTeam = defaultTeam
    }
    if (!selectedTeam) {
      selectedTeam = teamOptions?.[0]?.code
    }

    teamOptions = teamOptions.map(({ code, description }) => {
      const option: Team = { code, description }
      if (code === selectedTeam) {
        option.selected = 'selected'
      }
      return option
    })

    logSessionCacheChange(
      'getUserOptions.selectedTeam',
      data,
      ['appointments', crn, id, 'user', 'teamCode'],
      selectedTeam,
      sessionCacheContext,
    )

    const { users } = await masClient.getStaffByTeam(selectedTeam)

    const defaultUser = defaultUserDetails?.username || ''

    let userOptions = users.map(user => {
      const { username: staffUsername, nameAndRole, staffCode, email, name } = user
      const option: User = {
        username: staffUsername,
        nameAndRole: convertToTitleCase(nameAndRole, [], regexIgnoreValuesInParentheses),
        staffCode,
        email,
        name,
      }
      return option
    })

    userOptions = userOptions.sort((a, b) =>
      a.nameAndRole.localeCompare(b.nameAndRole, undefined, { sensitivity: 'base' }),
    )

    if (!teamCodeQuery) {
      selectedUser = usernameSession || defaultUser
    }
    if (!selectedUser) {
      selectedUser = userOptions?.[0]?.username || ''
    }

    if (
      !providerCodeQuery &&
      !teamCodeQuery &&
      usernameSession &&
      usernameSession.toLowerCase() === probationPractitioner?.username?.toLowerCase()
    ) {
      selectedUser = defaultUser
    }

    userOptions = userOptions.map(({ username: staffUsername, ...restUserProps }) => {
      const option: User = { username: staffUsername, ...restUserProps }
      if (staffUsername.toLowerCase() === selectedUser.toLowerCase()) {
        option.selected = 'selected'
      }
      return option
    })

    logSessionCacheChange(
      'getUserOptions.selectedUser',
      data,
      ['appointments', crn, id, 'user', 'username'],
      selectedUser,
      sessionCacheContext,
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
