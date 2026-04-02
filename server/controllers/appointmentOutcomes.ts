import { v4 } from 'uuid'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { Controller, FileCache } from '../@types'
import { renderError } from '../middleware'
import { AppResponse } from '../models/Locals'
import { AppointmentOutcomeType } from '../models/Appointments'
import { setDataValue, getDataValue } from '../utils'
import config from '../config'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'

const routes = [
  'getOutcome',
  'postOutcome',
  'getAddNote',
  'postAddNote',
  'getAttendedComplied',
  'postAttendedComplied',
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

type RedirectMap = {
  [K in AppointmentOutcomeType]: string
}

const appointmentOutcomesController: Controller<typeof routes, void | AppResponse> = {
  getOutcome: _hmppsAuthClient => {
    return async (_req, res) => {
      return res.render('pages/appointment-outcomes/outcome')
    }
  },
  postOutcome: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId, isValidParams, baseUrl, id } = res.locals.appointmentOutcome
      if (!isValidParams) {
        return renderError(404)(req, res)
      }
      const { data } = req.session
      const type = getDataValue<AppointmentOutcomeType>(data, ['appointments', crn, id, 'outcome', 'type'])
      const redirectMap: RedirectMap = {
        ATTENDED: `${baseUrl}/add-note`,
        ATTENDED_SENT_HOME_BEHAVIOUR: `${baseUrl}/attended-failed-to-comply`,
        ATTENDED_DID_NOT_FOLLOW_INSTRUCTIONS: `${baseUrl}/attended-failed-to-comply`,
        ATTENDED_SENT_HOME_PROBATION_SERVICE_ISSUES: `${baseUrl}/attended-failed-to-comply`,
        ACCEPTABLE_ABSENCE: `${baseUrl}/acceptable-absence`,
        UNACCEPTABLE_ABSENCE: `${baseUrl}/unacceptable-absence`,
        EVIDENCE_REQUESTED: `${baseUrl}/failed-to-attend`,
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
  getAttendedComplied: _hmppsAuthClient => {
    return async (req, res) => {
      const { forename, surname, crn } = res.locals.appointmentOutcome
      const { alertDismissed = false } = req.session
      await auditService.sendAuditMessage({
        action: 'VIEW_RECORD_AN_OUTCOME',
        who: res.locals.user.username,
        subjectId: crn,
        subjectType: 'CRN',
        correlationId: v4(),
        service: 'hmpps-manage-people-on-probation-ui',
      })
      const headerPersonName = { forename, surname }
      res.render('pages/appointment-outcomes/attended-complied', {
        alertDismissed,
        isInPast: true,
        headerPersonName,
      })
    }
  },
  postAttendedComplied: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id, isValidParams } = res.locals.appointmentOutcome
      if (!isValidParams) {
        return renderError(404)(req, res)
      }
      const { data } = req.session
      setDataValue(data, ['appointments', crn, id, 'outcomeRecorded'], true) // <--- this needs refactoring
      return res.redirect(`/case/${crn}/appointments/appointment/${id}/add-note`)
    }
  },
  getAttendedFailedToComply: _hmppsAuthClient => {
    return async (req, res) => res.render('pages/appointment-outcomes/attended-failed-to-comply')
  },
  postAttendedFailedToComply: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/attended-failed-to-comply')
  },
  getAcceptableAbsence: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/acceptable-absence')
  },
  postAcceptableAbsence: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/acceptable-absence')
  },
  getUnacceptableAbsence: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/unacceptable-absence')
  },
  postUnacceptableAbsence: () => {
    return async (req, res) => res.render('pages/appointment-outcomes/unacceptable-absence')
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
