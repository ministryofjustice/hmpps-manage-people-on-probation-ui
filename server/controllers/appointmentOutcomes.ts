import { Controller, FileCache, Route } from '../@types'
import { renderError } from '../middleware'
import { type AppResponse } from '../models/Locals'
import config from '../config'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'
import MasApiClient from '../data/masApiClient'
import { isSuccessfulUpload } from './appointments'
import { outcomeRedirectMap, type OutcomeRedirectMap } from '../properties/appointment-outcomes/outcome-redirect-map'

export const appointmentOutcomeRequests = [
  'getOutcome',
  'postOutcome',
  'getAddNote',
  'postAddNote',
  'getCheckYourAnswers',
  'postCheckYourAnswers',
  'getAttendedFailedToComply',
  'getAcceptableAbsence',
  'getUnacceptableAbsence',
  'getFailedToAttend',
  'getEnforcementAction',
  'getInitiateBreachOrRecall',
  'getSendLetter',
  'getUpdateEnforcementAction',
  'getConfirmation',
] as const

const appointmentOutcomesController: Controller<typeof appointmentOutcomeRequests, void | AppResponse> = {
  getOutcome: _hmppsAuthClient => {
    return async (_req, res) => {
      return res.render('pages/appointment-outcomes/outcome')
    }
  },
  postOutcome: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, contactId, isValidParams, baseOutcomeUrl, appointmentSession } = res.locals.appointmentOutcome
      const { change } = req.query
      if (!isValidParams) {
        return renderError(404)(req, res)
      }
      const outcomeType = appointmentSession?.outcome?.outcomeType
      const map: OutcomeRedirectMap = {
        ...outcomeRedirectMap(baseOutcomeUrl),
        WILL_BE_RESCHEDULED: `/case/${crn}/appointment/${contactId}/reschedule`,
      }
      const redirect = `${map[outcomeType]}${change ? `?change=${change}` : ''}`
      console.log(redirect)
      return res.redirect(redirect)
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
      const { crn, isValidParams, id, contactId, uuid, baseOutcomeUrl, appointmentSession } =
        res.locals.appointmentOutcome
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
      let redirect = baseOutcomeUrl
      /* Arrange or reschedule appointment journey */
      if (uuid) {
        redirect = `/case/${crn}/arrange-appointment/${id}/check-your-answers`
      }
      /* Manage appointment journey with no next appointment arranged */
      if (contactId && !appointmentSession?.linkedContactId) {
        redirect = `${baseOutcomeUrl}/next-appointment`
      }
      /* Manage appointment journey with next appointment arranged */
      if (contactId && appointmentSession?.linkedContactId) {
        redirect = `${baseOutcomeUrl}/check-your-answers`
      }
      if (change) redirect = change
      return res.redirect(redirect)
    }
  },
  getCheckYourAnswers: _hmppsAuthClient => {
    return async (req, res) => {
      const url = encodeURIComponent(req.url)
      return res.render('pages/appointment-outcomes/check-your-answers', { url })
    }
  },
  postCheckYourAnswers: _hmppsAuthClient => {
    return async (_req, res) => {
      const { id, crn, baseOutcomeUrl } = res.locals.appointmentOutcome
      // 👉 PUT request here to update outcome
      return res.redirect(`${baseOutcomeUrl}/confirmation`)
    }
  },
  getConfirmation: _hmppsAuthClient => {
    return async (_req, res) => {
      return res.render('pages/appointment-outcomes/confirmation')
    }
  },
  getAttendedFailedToComply: _hmppsAuthClient => async (_req, res) =>
    res.render('pages/appointment-outcomes/attended-failed-to-comply'),
  getAcceptableAbsence: () => async (_req, res) => res.render('pages/appointment-outcomes/acceptable-absence'),
  getUnacceptableAbsence: () => async (_req, res) => res.render('pages/appointment-outcomes/unacceptable-absence'),
  getFailedToAttend: () => async (_req, res) => res.render('pages/appointment-outcomes/failed-to-attend'),
  getEnforcementAction: () => async (_req, res) => res.render('pages/appointment-outcomes/enforcement-action'),
  getInitiateBreachOrRecall: () => async (_req, res) =>
    res.render('pages/appointment-outcomes/initiate-breach-or-recall'),
  getSendLetter: () => async (_req, res) => res.render('pages/appointment-outcomes/send-letter'),
  getUpdateEnforcementAction: () => async (_req, res) =>
    res.render('pages/appointment-outcomes/update-enforcement-action'),
}

export default appointmentOutcomesController
