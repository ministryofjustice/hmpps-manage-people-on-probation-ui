import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { convertToTitleCase, getDataValue, setDataValue } from '../utils'
import { Name } from '../data/model/personalDetails'

export const getDefaultUserV2 = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void | null>> => {
  return async function getDefaultUserV2Inner(req, res, next) {
    const { crn, id } = req.params as Record<string, string>
    const { username } = res.locals.user
    const { data } = req.session

    // eslint-disable-next-line no-useless-escape
    const regexIgnoreValuesInParentheses = /[\(\)]/
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)

    let attendingUsername = getDataValue<string>(data, ['appointments', crn, id, 'user', 'username']) ?? null
    let providerCode = getDataValue(data, ['appointments', crn, id, 'user', 'providerCode']) ?? null
    let provider = getDataValue(data, ['appointments', crn, id, 'user', 'provider']) ?? null
    let teamCode = getDataValue(data, ['appointments', crn, id, 'user', 'teamCode']) ?? null
    let team = getDataValue(data, ['appointments', crn, id, 'user', 'team']) ?? null
    let attendingEmail: string
    let attendingName: Name

    if (!attendingUsername || !providerCode || !teamCode) {
      const probationPractitioner = await masClient.getProbationPractitioner(crn)
      let useProbationPractitioner = true

      if (!probationPractitioner?.unallocated) {
        const usersMaybe = await masClient.getUserProviders(
          username,
          probationPractitioner?.provider?.code,
          probationPractitioner?.team?.code,
        )
        attendingUsername = usersMaybe.users.find(user => user.username === probationPractitioner.username)?.nameAndRole
        if (attendingUsername !== undefined) {
          providerCode = probationPractitioner.provider.code
          provider = probationPractitioner.provider.name
          teamCode = probationPractitioner.team.code
          team = probationPractitioner.team.description
          if (res.locals.flags.enableMAN2344) {
            attendingEmail = probationPractitioner.email
            attendingName = probationPractitioner.name
          }
        } else {
          useProbationPractitioner = false
        }
      } else {
        useProbationPractitioner = false
      }

      if (!useProbationPractitioner) {
        const { defaultUserDetails, providers, teams, users } = await masClient.getUserProviders(username)
        attendingUsername = users.find(
          user => user.username === defaultUserDetails?.username?.toLowerCase(),
        )?.nameAndRole
        providerCode = providers.find(p => p.name === defaultUserDetails.homeArea)?.code
        provider = defaultUserDetails?.homeArea
        teamCode = teams.find(t => t.description === defaultUserDetails.team)?.code
        team = defaultUserDetails?.team
        if (res.locals.flags.enableMAN2344) {
          attendingEmail = defaultUserDetails?.email
          attendingName = defaultUserDetails?.name
        }
      }

      setDataValue(data, ['appointments', crn, id, 'user', 'providerCode'], providerCode)
      setDataValue(data, ['appointments', crn, id, 'user', 'provider'], provider)
      setDataValue(data, ['appointments', crn, id, 'user', 'teamCode'], teamCode)
      setDataValue(data, ['appointments', crn, id, 'user', 'team'], team)
      const nameAndRole = convertToTitleCase(attendingUsername, [], regexIgnoreValuesInParentheses)
      setDataValue(data, ['appointments', crn, id, 'user', 'username'], nameAndRole)
      if (res.locals.flags.enableMAN2344) {
        setDataValue(data, ['appointments', crn, id, 'user', 'email'], attendingEmail)
        setDataValue(data, ['appointments', crn, id, 'user', 'name'], attendingName)
      }
    } else if (res.locals.flags.enableMAN2344) {
      attendingEmail = getDataValue<string>(data, ['appointments', crn, id, 'user', 'email']) ?? null
      attendingName = getDataValue<Name>(data, ['appointments', crn, id, 'user', 'name']) ?? null
      if (!attendingEmail || !attendingName) {
        const { defaultUserDetails } = await masClient.getUserProviders(attendingUsername, providerCode, teamCode)
        attendingEmail = defaultUserDetails?.email
        attendingName = defaultUserDetails.name
        setDataValue(data, ['appointments', crn, id, 'user', 'email'], attendingEmail)
        setDataValue(data, ['appointments', crn, id, 'user', 'name'], attendingName)
      }
    }
    return next()
  }
}

// NEED TO MAINTAIN CACHING
// WHY IS STORING PROVIDERS, TEAMS, USERS NEEDED
