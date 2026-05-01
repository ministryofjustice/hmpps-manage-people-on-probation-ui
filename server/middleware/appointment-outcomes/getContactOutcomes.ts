import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'

export const getContactOutcomes = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (_req, res, next) => {
    const {
      crn,
      appointmentSession: { type: typeCode },
    } = res.locals.appointmentOutcome
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const { outcomes, enforcementActions } = await masClient.getContactOutcomes(typeCode)
    res.locals.appointmentOutcome = {
      ...res.locals.appointmentOutcome,
      outcomes,
      enforcementActions,
    }
    return next()
  }
}
