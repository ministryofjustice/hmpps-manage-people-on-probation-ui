import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'
import { Schedule } from '../data/model/schedule'

export const getPersonSchedule = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const response: Schedule = await masClient.getPersonSchedule(crn, 'previous', '0')
    res.locals.personSchedule = response.personSchedule
    return next()
  }
}
