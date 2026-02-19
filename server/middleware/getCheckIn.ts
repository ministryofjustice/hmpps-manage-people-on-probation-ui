import { NextFunction, Request } from 'express'
import { DateTime } from 'luxon'
import { AppResponse } from '../models/Locals'
import { HmppsAuthClient } from '../data'
import ESupervisionClient from '../data/eSupervisionClient'
import { ESupervisionLog } from '../data/model/esupervision'

export const getCheckIn = (hmppsAuthClient: HmppsAuthClient) => {
  return async (req: Request, res: AppResponse, next: NextFunction): Promise<void> => {
    const { id } = req.params as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const eSupervisionClient = new ESupervisionClient(token)
    const checkInResponse = await eSupervisionClient.getOffenderCheckIn(id)

    let reviewDueDate = null
    if (checkInResponse.status === 'EXPIRED') {
      reviewDueDate = DateTime.fromISO(checkInResponse.dueDate).plus({ days: 3 })
    } else if (checkInResponse.submittedAt) {
      reviewDueDate = DateTime.fromISO(checkInResponse.submittedAt).plus({ days: 3 })
    }
    if (reviewDueDate) {
      reviewDueDate = reviewDueDate.toFormat('d MMMM yyyy')
      checkInResponse.reviewDueDate = reviewDueDate.toString()
    }

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
    return next()
  }
}
