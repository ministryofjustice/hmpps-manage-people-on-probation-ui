import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'

export const getWhoAttends = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { username } = res.locals.user
    const { regionCode, teamCode, crn, id } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)

    const region = regionCode || req?.session?.data?.appointments?.[crn]?.[id]?.region
    const team = teamCode || req?.session?.data?.appointments?.[crn]?.[id]?.team

    const userProviders = await masClient.getUserProviders(username, region, team)

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

    res.locals.userProviders = req.session.data.providers[username]
    res.locals.userTeams = req.session.data.teams[username]
    res.locals.userStaff = req.session.data.staff[username]

    return next()
  }
}
