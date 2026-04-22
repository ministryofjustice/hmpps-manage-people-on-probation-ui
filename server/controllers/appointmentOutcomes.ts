import { Request, Response } from 'express'
import { Controller, FileCache } from '../@types'
import { renderError } from '../middleware'
import { AppResponse } from '../models/Locals'
import { AppointmentEnforcementAction, AppointmentOutcomeType } from '../models/Appointments'
import { getDataValue } from '../utils'
import config from '../config'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'

export const appointmentOutcomeRequests = [
  'getOutcome',
  'postOutcome',
  'getAddNote',
  'postAddNote',
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

const enforcementActionRedirects = (req: Request, res: Response): void => {
  const { data } = req.session
  const { crn, id, baseOutcomeUrl } = res.locals.appointmentOutcome
  const enforcementAction = getDataValue<AppointmentEnforcementAction>(data, [
    'appointments',
    crn,
    id,
    'outcome',
    'enforcementAction',
  ])
  const redirectMap: EnforcementRedirectMap = {
    SEND_LETTER: `${baseOutcomeUrl}/send-letter`,
    INITIATE_BREACH_RECALL: `${baseOutcomeUrl}/initiate-breach-or-recall`,
    INITIATE_BREACH_RECALL_AND_SEND_LETTER: `${baseOutcomeUrl}/initiate-breach-or-recall`,
    DECISION_PENDING: `${baseOutcomeUrl}/add-note`,
    REFER_TO_OFFENDER_MANAGER: `${baseOutcomeUrl}/add-note`,
    NO_FURTHER_ACTION: `${baseOutcomeUrl}/add-note`,
    DIFFERENT_ACTION: `${baseOutcomeUrl}/enforcement-action`,
  }
  return res.redirect(redirectMap[enforcementAction])
}

const appointmentOutcomesController: Controller<typeof appointmentOutcomeRequests, void | AppResponse> = {
  getOutcome: _hmppsAuthClient => {
    return async (_req, res) => {
      return res.render('pages/appointment-outcomes/outcome')
    }
  },
  postOutcome: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId, isValidParams, baseOutcomeUrl, id } = res.locals.appointmentOutcome
      if (!isValidParams) {
        return renderError(404)(req, res)
      }
      const { data } = req.session
      const type = getDataValue<AppointmentOutcomeType>(data, ['appointments', crn, id, 'outcome', 'type'])
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
      return res.redirect(redirectMap[type])
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
  postAddNote: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, isValidParams, contactId, uuid } = res.locals.appointmentOutcome
      const { change } = req.query as Record<string, string>
      if (!isValidParams) {
        return renderError(404)(req, res)
      }
      const redirect = uuid
        ? `/case/${crn}/arrange-appointment/${uuid}/check-your-answers`
        : `/case/${crn}/appointments/appointment/${contactId}/manage`
      return res.redirect(change ?? redirect)
    }
  },
  getAttendedFailedToComply: _hmppsAuthClient => {
    return async (_req, res) => res.render('pages/appointment-outcomes/attended-failed-to-comply')
  },
  postAttendedFailedToComply: () => {
    return async (req, res) => enforcementActionRedirects(req, res)
  },
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
  postUnacceptableAbsence: () => {
    return async (req, res) => enforcementActionRedirects(req, res)
  },
  getFailedToAttend: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/failed-to-attend')
  },
  postFailedToAttend: () => {
    return async (req, res) => enforcementActionRedirects(req, res)
  },
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
    return async (req, res) => res.render('pages/appointment-outcomes/send-letter')
  },
  getUpdateEnforcementAction: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/update-enforcement-action')
  },
  postUpdateEnforcementAction: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/update-enforcement-action')
  },
}

export default appointmentOutcomesController
