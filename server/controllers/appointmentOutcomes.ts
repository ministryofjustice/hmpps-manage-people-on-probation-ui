import { Request, Response } from 'express'
import { Controller, FileCache } from '../@types'
import { renderError } from '../middleware'
import { AppResponse } from '../models/Locals'
import { AppointmentEnforcementAction, AppointmentOutcomeType, AppointmentPatch } from '../models/Appointments'
import { getDataValue, handleQuotes } from '../utils'
import config from '../config'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'
import MasApiClient from '../data/masApiClient'
import { isSuccessfulUpload } from './appointments'

const routes = [
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

const sharedRedirects = (req: Request, res: Response): void => {
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
    REFER_TO_OFFENDER_MANAGER: `${baseOutcomeUrl}/add-note`,
    NO_FURTHER_ACTION: `${baseOutcomeUrl}/add-note`,
    DIFFERENT_ACTION: `${baseOutcomeUrl}/enforcement-action`,
  }
  return res.redirect(redirectMap[enforcementAction])
}

const appointmentOutcomesController: Controller<typeof routes, void | AppResponse> = {
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
      const { crn, isValidParams, contactId, uuid, appointmentSession } = res.locals.appointmentOutcome
      if (!isValidParams) {
        return renderError(404)(req, res)
      }
      // if not manage journey, redirect to CYA page
      if (uuid) {
        return res.redirect(`/case/${crn}/arrange-appointment/${uuid}/check-your-answers`)
      }
      // if manage journey, patch appointment then redirect to manage page
      const { notes, sensitivity } = appointmentSession
      const sensitive = sensitivity === 'Yes'
      const file = req.file as Express.Multer.File
      const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const body: AppointmentPatch = {
        id: parseInt(contactId, 10),
        notes: handleQuotes(notes),
        sensitive,
        outcomeRecorded: true,
      }
      await masClient.patchAppointment(body)
      if (file) {
        const patchResponse = await masClient.patchDocuments(crn, contactId, file)
        if (!isSuccessfulUpload(patchResponse)) {
          return res.render('pages/appointment-outcomes/add-note', {
            uploadError: 'File not uploaded. Please try again.',
            patchResponse,
            sensitive,
            notes,
          })
        }
      }
      return res.redirect(`/case/${crn}/appointments/appointment/${contactId}/manage`)
    }
  },
  getAttendedFailedToComply: _hmppsAuthClient => {
    return async (_req, res) => res.render('pages/appointment-outcomes/attended-failed-to-comply')
  },
  postAttendedFailedToComply: () => {
    return async (req, res) => sharedRedirects(req, res)
  },
  getAcceptableAbsence: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/acceptable-absence')
  },
  postAcceptableAbsence: () => {
    return async (req, res) => {
      const { baseOutcomeUrl } = res.locals.appointmentOutcome
      return res.redirect(`${baseOutcomeUrl}/add-note`)
    }
  },
  getUnacceptableAbsence: () => {
    return async (_req, res) => res.render('pages/appointment-outcomes/unacceptable-absence')
  },
  postUnacceptableAbsence: () => {
    return async (req, res) => sharedRedirects(req, res)
  },
  getFailedToAttend: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/failed-to-attend')
  },
  postFailedToAttend: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/failed-to-attend')
  },
  getEnforcementAction: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/enforcement-action')
  },
  postEnforcementAction: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/enforcement-action')
  },
  getInitiateBreachOrRecall: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/initiate-breach-or-recall')
  },
  postInitiateBreachOrRecall: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/initiate-breach-or-recall')
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
