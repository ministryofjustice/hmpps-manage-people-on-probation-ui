import { Request, Response } from 'express'
import { Controller, FileCache } from '../@types'
import { renderError } from '../middleware'
import { AppResponse } from '../models/Locals'
import { AppointmentEnforcementAction, AppointmentOutcomeType, AppointmentSessionOutcome } from '../models/Appointments'
import config from '../config'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'
import MasApiClient from '../data/masApiClient'
import { isSuccessfulUpload } from './appointments'

export const appointmentOutcomeRequests = [
  'getOutcome',
  'postOutcome',
  'getAddNote',
  'postAddNote',
  'getCheckYourAnswers',
  'postCheckYourAnswers',
  'getAttendedFailedToComply',
  'postAttendedFailedToComply',
  'getAcceptableAbsence',
  'postAcceptableAbsence',
  'getUnacceptableAbsence',
  'postUnacceptableAbsence',
  'getFailedToAttend',
  'postFailedToAttend',
  'getEnforcementAction',
  'postEnforcementAction',
  'getInitiateBreachOrRecall',
  'postInitiateBreachOrRecall',
  'getSendLetter',
  'postSendLetter',
  'getUpdateEnforcementAction',
  'postUpdateEnforcementAction',
] as const

type OutcomeRedirectMap = {
  [K in AppointmentOutcomeType]: string
}
type EnforcementRedirectMap = {
  [K in AppointmentEnforcementAction]?: string
}

const enforcementActionRedirects = (pageKey: keyof AppointmentSessionOutcome, req: Request, res: Response): void => {
  const { baseOutcomeUrl, appointmentSession, reqUrl } = res.locals.appointmentOutcome
  const enforcementAction = appointmentSession?.outcome?.[pageKey] as AppointmentEnforcementAction
  const isUpdateAction = reqUrl?.includes('/update-enforcement-action')
  const redirectMap: EnforcementRedirectMap = {
    SEND_LETTER: `${baseOutcomeUrl}/send-letter`,
    SEND_ANOTHER_LETTER: `${baseOutcomeUrl}/send-letter`,
    DIFFERENT_ACTION: `${baseOutcomeUrl}/enforcement-action`,
  }
  if (!isUpdateAction) {
    redirectMap.BREACH_RECALL_INITIATED = `${baseOutcomeUrl}/initiate-breach-or-recall`
    redirectMap.BREACH_RECALL_INITIATED_AND_SEND_LETTER = `${baseOutcomeUrl}/initiate-breach-or-recall`
  }
  const redirect = redirectMap?.[enforcementAction] || `${baseOutcomeUrl}/add-note`
  return res.redirect(redirect)
}

const appointmentOutcomesController: Controller<typeof appointmentOutcomeRequests, void | AppResponse> = {
  getOutcome: _hmppsAuthClient => {
    return async (_req, res) => {
      return res.render('pages/appointment-outcomes/outcome')
    }
  },
  postOutcome: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId, isValidParams, baseOutcomeUrl, appointmentSession } = res.locals.appointmentOutcome
      if (!isValidParams) {
        return renderError(404)(req, res)
      }
      const outcomeType = appointmentSession?.outcome?.outcomeType
      const redirectMap: OutcomeRedirectMap = {
        ATTENDED_COMPLIED: `${baseOutcomeUrl}/add-note`,
        ATTENDED_FAILED_TO_COMPLY: `${baseOutcomeUrl}/attended-failed-to-comply`,
        ATTENDED_SENT_HOME_BEHAVIOUR: `${baseOutcomeUrl}/attended-failed-to-comply`,
        ATTENDED_SENT_HOME_SERVICE_ISSUES: `${baseOutcomeUrl}/attended-failed-to-comply`,
        ACCEPTABLE_ABSENCE: `${baseOutcomeUrl}/acceptable-absence`,
        UNACCEPTABLE_ABSENCE: `${baseOutcomeUrl}/unacceptable-absence`,
        FAILED_TO_ATTEND: `${baseOutcomeUrl}/failed-to-attend`,
        WILL_BE_RESCHEDULED: `/case/${crn}/appointment/${contactId}/reschedule`,
      }
      return res.redirect(redirectMap[outcomeType])
    }
  },
  getAddNote: () => {
    return async (req, res) => {
      const { crn } = res.locals.appointmentOutcome
      let uploadedFiles: FileCache[] = []
      let errorMessages = null
      let body = null
      if (req?.session?.cache?.uploadedFiles) {
        uploadedFiles = req.session.cache.uploadedFiles
        delete req.session.cache.uploadedFiles
      }
      if (req?.session?.errorMessages) {
        errorMessages = req.session.errorMessages
        delete req.session.errorMessages
      }
      if (req?.session?.body) {
        body = req.session.body
        delete req.session.body
      }
      await sendAuditMessage(res, 'ADD_MAS_APPOINTMENT_NOTE', crn, SubjectType.CRN)
      const { validMimeTypes, maxFileSize, fileUploadLimit, maxCharCount } = config
      return res.render('pages/appointment-outcomes/add-note', {
        useDecorator: true,
        errorMessages,
        body,
        validMimeTypes: Object.entries(validMimeTypes).map(([_key, value]) => value),
        maxFileSize,
        fileUploadLimit,
        uploadedFiles,
        maxCharCount,
      })
    }
  },
  postAddNote: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, isValidParams, id, uuid } = res.locals.appointmentOutcome
      const { change } = req.query as Record<string, string>
      const { notes, sensitive } = req.body
      if (!isValidParams) {
        return renderError(404)(req, res)
      }
      const file = req.file as Express.Multer.File
      if (file) {
        const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
        const masClient = new MasApiClient(token)
        const patchResponse = await masClient.patchDocuments(crn, id, file)
        if (!isSuccessfulUpload(patchResponse)) {
          return res.render('pages/appointment-outcomes/add-note', {
            uploadError: 'File not uploaded. Please try again.',
            patchResponse,
            sensitive,
            notes,
          })
        }
      }
      const redirect = uuid
        ? `/case/${crn}/arrange-appointment/${id}/check-your-answers`
        : `/case/${crn}/appointments/appointment/${id}/check-your-answers`
      return res.redirect(change ?? redirect)
    }
  },
  getCheckYourAnswers: _hmppsAuthClient => {
    return async (_req, res) => res.render('pages/appointment-outcomes/check-your-answers')
  },
  postCheckYourAnswers: _hmppsAuthClient => {
    return async (_req, res) => {
      const { id, crn } = res.locals.appointmentOutcome
      return res.redirect(`/case/${crn}/appointments/appointment/${id}/manage`)
    }
  },
  getAttendedFailedToComply: _hmppsAuthClient => {
    return async (_req, res) => res.render('pages/appointment-outcomes/attended-failed-to-comply')
  },
  postAttendedFailedToComply: () => async (req, res) => enforcementActionRedirects('attendedFailedToComply', req, res),
  getAcceptableAbsence: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/acceptable-absence')
  },
  postAcceptableAbsence: () => {
    return async (_req, res) => {
      const { baseOutcomeUrl } = res.locals.appointmentOutcome
      return res.redirect(`${baseOutcomeUrl}/add-note`)
    }
  },
  getUnacceptableAbsence: () => {
    return async (_req, res) => res.render('pages/appointment-outcomes/unacceptable-absence')
  },
  postUnacceptableAbsence: () => async (req, res) => enforcementActionRedirects('unacceptableAbsence', req, res),
  getFailedToAttend: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/failed-to-attend')
  },
  postFailedToAttend: () => async (req, res) => enforcementActionRedirects('failedToAttend', req, res),
  getEnforcementAction: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/enforcement-action')
  },
  postEnforcementAction: () => {
    return async (_req, res) => {
      const { baseOutcomeUrl } = res.locals.appointmentOutcome
      return res.redirect(`${baseOutcomeUrl}/add-note`)
    }
  },
  getInitiateBreachOrRecall: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/initiate-breach-or-recall')
  },
  postInitiateBreachOrRecall: () => {
    return async (_req, res) => {
      const { baseOutcomeUrl } = res.locals.appointmentOutcome
      return res.redirect(`${baseOutcomeUrl}/add-note`)
    }
  },
  getSendLetter: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/send-letter')
  },
  postSendLetter: () => {
    return async (_req, res) => {
      const { baseOutcomeUrl } = res.locals.appointmentOutcome
      return res.redirect(`${baseOutcomeUrl}/add-note`)
    }
  },
  getUpdateEnforcementAction: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/update-enforcement-action')
  },
  postUpdateEnforcementAction: () => async (req, res) =>
    enforcementActionRedirects('updateEnforcementAction', req, res),
}

export default appointmentOutcomesController
