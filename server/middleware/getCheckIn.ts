import { NextFunction, Request } from 'express'
import { DateTime } from 'luxon'
import { add } from 'date-fns'
import { format } from 'date-fns/format'
import { AppResponse } from '../models/Locals'
import { HmppsAuthClient } from '../data'
import ESupervisionClient from '../data/eSupervisionClient'
import { ESupervisionLog } from '../data/model/esupervision'

export const getCheckIn = (hmppsAuthClient: HmppsAuthClient) => {
  return async (req: Request, res: AppResponse, next: NextFunction): Promise<void> => {
    const { id } = req.params
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const eSupervisionClient = new ESupervisionClient(token)
    const checkInResponse = await eSupervisionClient.getOffenderCheckIn(id)

    let reviewDueDate = null
    if (checkInResponse.status === 'EXPIRED') {
      reviewDueDate = add(new Date(checkInResponse.dueDate), { days: 6 })
    } else if (checkInResponse.submittedAt) {
      reviewDueDate = add(new Date(checkInResponse.submittedAt), { days: 3 })
    }
    reviewDueDate = format(reviewDueDate, 'd MMMM yyyy')
    checkInResponse.reviewDueDate = reviewDueDate

    for (let i = 0; i < checkInResponse.checkinLogs.logs.length; i += 1) {
      const log = checkInResponse.checkinLogs.logs[i]
      if (log.logEntryType === 'OFFENDER_CHECKIN_NOT_SUBMITTED') {
        checkInResponse.missedCheckinComment = log.notes
      }
      if (log.logEntryType === 'OFFENDER_CHECKIN_REVIEW_SUBMITTED') {
        checkInResponse.furtherActions = log.notes
      }
      if (log.logEntryType === 'OFFENDER_CHECKIN_ANNOTATED') {
        const note = {
          id: i,
          createdBy: log.practitioner,
          createdByDate: log.createdAt,
          note: log.notes,
        }
        if (checkInResponse.notes) {
          checkInResponse.notes.push(note)
        } else {
          checkInResponse.notes = [note]
        }
      }
    }
    res.locals.checkIn = checkInResponse
    console.log(res.locals.checkIn.reviewDueDate)
    return next()
  }
}
