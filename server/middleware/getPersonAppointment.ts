import { HmppsAuthClient, type Route } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import MasApiClient from '../data/masApiClient'

export const getPersonAppointment = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const { crn, contactId } = req.params as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    res.locals.personAppointment = await masClient.getPersonAppointment(crn, contactId)
    return next()
  }
}
