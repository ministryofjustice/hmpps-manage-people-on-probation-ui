import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'

export const getOverdueOutcomes = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async function getOverdueOutcomesInner(req, res, next) {
    const { crn } = req.params as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    res.locals.contactResponse = await masClient.getOverdueOutcomes(crn)
    return next()
  }
}
