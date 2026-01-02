import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { Route } from '../@types'

export const getPersonAppointment = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, contactId } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const response = await masClient.getPersonAppointment(crn, contactId)
    res.locals.personAppointment = response
    return next()
  }
}
