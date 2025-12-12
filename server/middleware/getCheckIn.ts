import { NextFunction, Request } from 'express'
import { AppResponse } from '../models/Locals'
import { HmppsAuthClient } from '../data'
import ESupervisionClient from '../data/eSupervisionClient'

export const getCheckIn = (hmppsAuthClient: HmppsAuthClient) => {
  return async (req: Request, res: AppResponse, next: NextFunction): Promise<void> => {
    const { id } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const eSupervisionClient = new ESupervisionClient(token)
    const checkInResponse = await eSupervisionClient.getOffenderCheckIn(id)
    console.log(checkInResponse)
    res.locals.checkIn = checkInResponse
    return next()
  }
}
