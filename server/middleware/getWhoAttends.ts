import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'

export const getWhoAttends = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { username } = res.locals.user
    const { crn, id } = req.params
    const regionCode = req.query.regionCode as string
    const teamCode = req.query.teamCode as string
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)

    const region = regionCode || req?.session?.data?.appointments?.[crn]?.[id]?.region
    const userProviders = await masClient.getUserProviders(username, region, teamCode)

    req.session.data = {
      ...(req?.session?.data ?? {}),
      providers: {
        ...(req?.session?.data?.providers ?? {}),
        [username]: userProviders.providers,
      },
      teams: {
        ...(req?.session?.data?.teams ?? {}),
        [username]: userProviders.teams,
      },
      staff: {
        ...(req?.session?.data?.staff ?? {}),
        [username]: userProviders.users,
      },
    }

    res.locals.userProviders = userProviders.providers
    res.locals.userTeams = userProviders.teams
    res.locals.userStaff = userProviders.users

    return next()
  }
}
