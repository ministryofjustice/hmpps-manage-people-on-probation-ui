import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'

export const getWhoWillAttend = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { username } = res.locals.user
    const regionCode = req.query.regionCode as string
    const teamCode = req.query.teamCode as string
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)
    const userProviders = await masClient.getUserProviders(username, regionCode, teamCode)

    const providers = userProviders.providers.map((p, index) => {
      if (p.code === regionCode) {
        return { code: p.code, name: p.name, selected: true }
      }

      return { code: p.code, name: p.name }
    })

    req.session.data = {
      ...(req?.session?.data ?? {}),
      providers: {
        ...(req?.session?.data?.providers ?? {}),
        [username]: providers,
      },
      teams: {
        ...(req?.session?.data?.teams ?? {}),
        [username]: userProviders.teams,
      },
      staff: {
        ...(req?.session?.data?.providers ?? {}),
        [username]: userProviders.users,
      },
    }

    res.locals.userProviders = req.session.data.providers[username]
    res.locals.userTeams = req.session.data.teams[username]
    res.locals.userStaff = req.session.data.staff[username]

    return next()
  }
}
