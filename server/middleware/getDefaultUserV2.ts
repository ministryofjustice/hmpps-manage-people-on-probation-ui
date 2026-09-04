import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { convertToTitleCase, getDataValue, setDataValue } from '../utils'
import { Name } from '../data/model/personalDetails'
import { ProbationPractitioner } from '../models/CaseDetail'

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
    let teamCode = getDataValue(data, ['appointments', crn, id, 'user', 'teamCode']) ?? null
    let attendingEmail = getDataValue<string>(data, ['appointments', crn, id, 'user', 'email']) ?? null
    let attendingName = getDataValue<Name>(data, ['appointments', crn, id, 'user', 'name']) ?? null
    let providers = getDataValue(data, ['providers', username]) ?? null
    let teams = getDataValue(data, ['teams', username]) ?? null
    let users = getDataValue(data, ['staff', username]) ?? null

    if (
      !attendingUsername ||
      !providerCode ||
      !teamCode ||
      ((!attendingEmail || !attendingName) && res.locals.flags.enableMAN2344) ||
      !providers ||
      !teams ||
      !users
    ) {
      let useProbationPractitioner = true
      let probationPractitioner: ProbationPractitioner
      if (!providerCode && !teamCode && !attendingUsername) {
        probationPractitioner = await masClient.getProbationPractitioner(crn)
      }

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
        attendingUsername = PPusers.find(user => user.username === probationPractitioner.username)?.nameAndRole
        if (attendingUsername !== undefined) {
          providerCode = probationPractitioner.provider.code
          teamCode = probationPractitioner.team.code
          if (res.locals.flags.enableMAN2344) {
            attendingEmail = probationPractitioner.email
            attendingName = probationPractitioner.name
          }
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
        } = await masClient.getUserProviders(username)
        attendingUsername = defaultUsers.find(
          user => user.username === defaultUserDetails?.username?.toLowerCase(),
        )?.nameAndRole
        providerCode = defaultProviders.find(p => p.name === defaultUserDetails.homeArea)?.code
        teamCode = defaultTeams.find(t => t.description === defaultUserDetails.team)?.code
        if (res.locals.flags.enableMAN2344) {
          attendingEmail = defaultUserDetails?.email
          attendingName = defaultUserDetails?.name
        }
        providers = defaultProviders
        teams = defaultTeams
        users = defaultUsers
      }

      setDataValue(data, ['appointments', crn, id, 'user', 'providerCode'], providerCode)
      setDataValue(data, ['appointments', crn, id, 'user', 'teamCode'], teamCode)
      const nameAndRole = convertToTitleCase(attendingUsername, [], regexIgnoreValuesInParentheses)
      setDataValue(data, ['appointments', crn, id, 'user', 'username'], nameAndRole)
      if (res.locals.flags.enableMAN2344) {
        setDataValue(data, ['appointments', crn, id, 'user', 'email'], attendingEmail)
        setDataValue(data, ['appointments', crn, id, 'user', 'name'], attendingName)
      }
      setDataValue(data, ['providers', username], providers)
      setDataValue(data, ['teams', username], teams)
      setDataValue(data, ['staff', username], users)
    }
    return next()
  }
}

// NEED TO MAINTAIN CACHING
