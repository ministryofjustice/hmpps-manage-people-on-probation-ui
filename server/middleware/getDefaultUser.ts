import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { getDataValue, setDataValue } from '../utils'
import { Name } from '../data/model/personalDetails'
import { ProbationPractitioner } from '../models/CaseDetail'
import { logSessionCacheChange } from '../utils/logSessionCacheChange'

export const getDefaultUser = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void | null>> => {
  return async function getDefaultUserInner(req, res, next) {
    const { crn, id } = req.params as Record<string, string>
    const { username } = res.locals.user
    const { data } = req.session

    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)

    let attendingUsername = getDataValue<string>(data, ['appointments', crn, id, 'user', 'username']) ?? null
    let providerCode = getDataValue(data, ['appointments', crn, id, 'user', 'providerCode']) ?? null
    let teamCode = getDataValue(data, ['appointments', crn, id, 'user', 'teamCode']) ?? null
    let attendingEmail = getDataValue<string>(data, ['appointments', crn, id, 'user', 'email']) ?? null
    let attendingName = getDataValue<Name>(data, ['appointments', crn, id, 'user', 'name']) ?? null
    let providers = getDataValue(data, ['providers', username]) ?? null
    let teams = getDataValue(data, ['teams', username]) ?? null
    let users = getDataValue(data, ['staff', username]) ?? null

    if (!attendingUsername || !providerCode || !teamCode || !providers || !teams || !users) {
      let useProbationPractitioner = true
      const probationPractitioner = await masClient.getProbationPractitioner(crn)

      if (!probationPractitioner?.unallocated) {
        const {
          providers: PPproviders,
          teams: PPteams,
          users: PPusers,
        } = await masClient.getUserProviders(
          username,
          probationPractitioner?.provider?.code,
          probationPractitioner?.team?.code,
        )
        attendingUsername = PPusers.find(
          user => user?.username?.toLowerCase() === probationPractitioner?.username?.toLowerCase(),
        )?.username
        if (attendingUsername !== undefined) {
          providerCode = probationPractitioner.provider.code
          teamCode = probationPractitioner.team.code
          attendingEmail = probationPractitioner.email
          attendingName = probationPractitioner.name
          providers = PPproviders
          teams = PPteams
          users = PPusers
        } else {
          useProbationPractitioner = false
        }
      } else {
        useProbationPractitioner = false
      }

      if (!useProbationPractitioner) {
        const {
          defaultUserDetails,
          providers: defaultProviders,
          teams: defaultTeams,
          users: defaultUsers,
        } = await masClient.getUserProviders(username, providerCode, teamCode)
        attendingUsername = defaultUserDetails?.username
        providerCode = defaultProviders.find(p => p.name === defaultUserDetails.homeArea)?.code
        teamCode = defaultTeams.find(t => t.description === defaultUserDetails.team)?.code
        attendingEmail = defaultUserDetails?.email
        attendingName = defaultUserDetails?.name
        providers = defaultProviders
        teams = defaultTeams
        users = defaultUsers
      }

      const defaultUserContext = {
        uuid: id,
        username: attendingUsername,
        enabled: res.locals.flags?.enableSessionCacheLogging,
      }
      logSessionCacheChange(
        'getDefaultUser',
        data,
        ['appointments', crn, id, 'user', 'providerCode'],
        providerCode,
        defaultUserContext,
      )
      logSessionCacheChange(
        'getDefaultUser',
        data,
        ['appointments', crn, id, 'user', 'email'],
        attendingEmail,
        defaultUserContext,
      )
      logSessionCacheChange(
        'getDefaultUser',
        data,
        ['appointments', crn, id, 'user', 'name'],
        attendingName,
        defaultUserContext,
      )

      setDataValue(data, ['appointments', crn, id, 'user', 'providerCode'], providerCode)
      setDataValue(data, ['appointments', crn, id, 'user', 'teamCode'], teamCode)
      setDataValue(data, ['appointments', crn, id, 'user', 'username'], attendingUsername)
      setDataValue(data, ['appointments', crn, id, 'user', 'email'], attendingEmail)
      setDataValue(data, ['appointments', crn, id, 'user', 'name'], attendingName)

      const sharedCacheContext = { uuid: id, username, enabled: res.locals.flags?.enableSessionCacheLogging }
      logSessionCacheChange('getDefaultUser', data, ['providers', username], providers, sharedCacheContext)
      logSessionCacheChange('getDefaultUser', data, ['teams', username], teams, sharedCacheContext)
      logSessionCacheChange('getDefaultUser', data, ['staff', username], users, sharedCacheContext)

      setDataValue(data, ['providers', username], providers)
      setDataValue(data, ['teams', username], teams)
      setDataValue(data, ['staff', username], users)
    }
    return next()
  }
}
