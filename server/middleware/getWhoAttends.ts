import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { Provider, Team } from '../data/model/caseload'

export const getWhoAttends = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { username } = res.locals.user
    const regionCode = req.query.regionCode as string
    const teamCode = req.query.teamCode as string
    const token = await hmppsAuthClient.getSystemClientToken(username)
    const masClient = new MasApiClient(token)
    const userProviders = await masClient.getUserProviders(username, regionCode, teamCode)

    const providers: Provider[] = userProviders.providers.map(p => {
      if (p.code === regionCode) {
        return { code: p.code, name: p.name, selected: 'selected' }
      }

      return p
    })

    const teams: Team[] = userProviders.teams.map(t => {
      if (t.code === teamCode) {
        return { code: t.code, description: t.description, selected: 'selected' }
      }

      return t
    })

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
