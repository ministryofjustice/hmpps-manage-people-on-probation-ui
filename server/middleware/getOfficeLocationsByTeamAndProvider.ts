import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { getDataValue } from '../utils'

export const getOfficeLocationsByTeamAndProvider = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, id } = req.params
    const { data } = req.session
    const { username } = res.locals.user
    const region = getDataValue(data, ['appointments', crn, id, 'region'])
    const team = getDataValue(data, ['appointments', crn, id, 'team'])
    const token = await hmppsAuthClient.getSystemClientToken(username)
    if (!req?.session?.data?.locations?.[username]) {
      const masClient = new MasApiClient(token)
      const userLocations = await masClient.getOfficeLocationsByTeamAndProvider(region, team)
      req.session.data = {
        ...(req?.session?.data ?? {}),
        locations: {
          ...(req?.session?.data?.locations ?? {}),
          [username]: userLocations.locations,
        },
      }
    }
    res.locals.userLocations = req.session.data.locations[username]
    return next()
  }
}
