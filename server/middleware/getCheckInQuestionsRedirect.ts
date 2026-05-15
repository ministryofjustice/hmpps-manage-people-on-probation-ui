import { Request, Response, NextFunction } from 'express'
import { Route } from '../@types'
import { renderError } from './renderError'
import { isValidCrn, isValidUUID } from '../utils'
import logger from '../../logger'
import ESupervisionClient from '../data/eSupervisionClient'

export const getCheckInQuestionsRedirect = (hmppsAuthClient: any): Route<Promise<void>> => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { crn, id } = req.params as Record<string, string>

    if (!isValidCrn(crn) || !isValidUUID(id)) {
      return renderError(404)(req, res)
    }

    try {
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const eSupClient = new ESupervisionClient(token)

      const upcomingCheckin = await eSupClient.getUpcomingCheckinQuestions(crn)

      const today = new Date().setHours(0, 0, 0, 0)
      const checkinDate = upcomingCheckin?.expectedCheckinDate
        ? new Date(upcomingCheckin.expectedCheckinDate).setHours(0, 0, 0, 0)
        : null

      const canEditQuestions = checkinDate ? today < checkinDate : false

      if (!canEditQuestions) {
        return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}`)
      }
      return next()
    } catch (error) {
      logger.error(`Failed to check if questions can be edited for CRN ${crn}`, error)
      return res.redirect(`/case/${crn}/appointments/check-in/manage/${id}`)
    }
  }
}
