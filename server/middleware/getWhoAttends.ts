import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'

export const getWhoAttends = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { username } = res.locals.user
    const { crn, id } = req.params
    const { providerCode, teamCode } = req.query as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)
    const region = providerCode || req?.session?.data?.appointments?.[crn]?.[id]?.user?.providerCode
    const { providers, teams, users } = await masClient.getUserProviders(username, region, teamCode)

    req.session.data = {
      ...(req?.session?.data ?? {}),
      providers: {
        ...(req?.session?.data?.providers ?? {}),
        [username]: providers,
      },
      teams: {
        ...(req?.session?.data?.teams ?? {}),
        [username]: teams,
      },
      staff: {
        ...(req?.session?.data?.staff ?? {}),
        [username]: users,
      },
    }

    res.locals.userProviders = providers
    res.locals.userTeams = teams
    res.locals.userStaff = users

    return next()
  }
}
