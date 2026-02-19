import { NextFunction, Request } from 'express'
import { AppResponse } from '../models/Locals'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'

export const getNextComAppointment = (hmppsAuthClient: HmppsAuthClient) => {
  return async (req: Request, res: AppResponse, next: NextFunction): Promise<void> => {
    const { crn, contactId } = req.params as Record<string, string>
    const { username } = res.locals.user
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const response = await masClient.getNextAppointment(username, crn, contactId)
    res.locals.nextAppointment = response
    return next()
  }
}
