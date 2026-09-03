import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { getDataValue, setDataValue } from '../utils'
import { Name } from '../data/model/personalDetails'

export const getDefaultUser = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void | null>> => {
  return async function getDefaultUserInner(req, res, next) {
    const { crn, id } = req.params as Record<string, string>
    const { username } = res.locals.user
    const { data } = req.session
    // eslint-disable-next-line no-useless-escape
    const regexIgnoreValuesInParentheses = /[\(\)]/
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)

    let attendingUsername = getDataValue<string>(data, ['appointments', crn, id, 'user', 'username']) ?? null
    let attendingEmail: string
    let attendingName: Name
    let providerCode = getDataValue(data, ['appointments', crn, id, 'user', 'providerCode']) ?? null
    let teamCode = getDataValue(data, ['appointments', crn, id, 'user', 'teamCode']) ?? null

    if (!attendingUsername || !providerCode || !teamCode) {
      const probationPractitioner = await masClient.getProbationPractitioner(crn)
      let useProbationPractitioner = true

      if (!probationPractitioner?.unallocated) {
        const usersMaybe = await masClient.getUserProviders(
          username,
          probationPractitioner?.provider?.code,
          probationPractitioner?.team?.code,
        )
        const isAvailableOption = usersMaybe.users.map(user => user.staffCode).includes(probationPractitioner.code)
        if (isAvailableOption) {
          attendingUsername = probationPractitioner.username
          if (res.locals.flags.enableMAN2344) {
            attendingEmail = probationPractitioner.email
            attendingName = probationPractitioner.name
          }
          providerCode = probationPractitioner.provider.code
          teamCode = probationPractitioner.team.code
        } else {
          useProbationPractitioner = false
        }
      } else {
        useProbationPractitioner = false
      }

      if (!useProbationPractitioner) {
        const { defaultUserDetails, providers, teams } = await masClient.getUserProviders(username)
        attendingUsername = defaultUserDetails?.username
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
    } else if (res.locals.flags.enableMAN2344) {
      attendingEmail = getDataValue<string>(data, ['appointments', crn, id, 'user', 'email']) ?? null
      attendingName = getDataValue<Name>(data, ['appointments', crn, id, 'user', 'name']) ?? null
      if (!attendingEmail || !attendingName) {
        const { defaultUserDetails } = await masClient.getUserProviders(attendingUsername, providerCode, teamCode)
        attendingEmail = defaultUserDetails?.email
        attendingName = defaultUserDetails.name
      }
      setDataValue(data, ['appointments', crn, id, 'user', 'email'], attendingEmail)
      setDataValue(data, ['appointments', crn, id, 'user', 'name'], attendingName)
    }
    return next()
  }
}

// NEED TO MAINTAIN CACHING
// MAKE THIS A V2
