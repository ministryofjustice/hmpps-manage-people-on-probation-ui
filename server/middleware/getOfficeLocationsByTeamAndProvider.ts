import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { getDataValue } from '../utils'

export const getOfficeLocationsByTeamAndProvider = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const regionCode = req.query.regionCode as string
    const { crn, id } = req.params
    const { data } = req.session
    const { username } = getDataValue(data, ['appointments', crn, id, 'username'])
    // const username = 'marcusaspin'
    const providerCode = getDataValue(data, ['appointments', crn, id, 'user', 'providerCode'])
    const teamCode = getDataValue(data, ['appointments', crn, id, 'user', 'teamCode'])
    const token = await hmppsAuthClient.getSystemClientToken(username)
    if (!req?.session?.data?.locations?.[username]) {
      const masClient = new MasApiClient(token)
      const userLocations = await masClient.getOfficeLocationsByTeamAndProvider(providerCode, teamCode)
      req.session.data = {
        ...(req?.session?.data ?? {}),
        locations: {
          ...(req?.session?.data?.locations ?? {}),
          [username]: userLocations.locations,
        },
      }
    }
    res.locals.regionCode = regionCode
    res.locals.teamCode = teamCode
    res.locals.userLocations = req.session.data.locations[username]
    return next()
  }
}
