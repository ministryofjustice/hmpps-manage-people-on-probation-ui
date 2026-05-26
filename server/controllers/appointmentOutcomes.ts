import { Request, Response } from 'express'
import { Controller, FileCache } from '../@types'
import { renderError } from '../middleware'
import { AppResponse } from '../models/Locals'
import config from '../config'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'
import MasApiClient from '../data/masApiClient'
import { isSuccessfulUpload } from './appointments'
import { getDataValue } from '../utils'
import { getBreach } from '../middleware/appointment-outcomes/getBreach'
import { outcomeRedirectMap, type OutcomeRedirectMap } from '../properties/appointment-outcomes/outcome-redirect-map'

async function getBreachInfo(
  hmppsAuthClient: Parameters<typeof getBreach>[0],
  req: Request,
  res: Response,
): Promise<Awaited<ReturnType<typeof getBreach>> | null> {
  if (!res.locals?.flags?.enableNonCompliance) return null
  const { params, session } = req
  const { headerCRN, user } = res.locals
  const selectedSentence = getDataValue(session.data, ['appointments', headerCRN, params.id, 'eventId'])
  return getBreach(hmppsAuthClient, user.username, headerCRN, selectedSentence)
}

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
] as const

const appointmentOutcomesController: Controller<typeof appointmentOutcomeRequests, void | AppResponse> = {
  getOutcome: hmppsAuthClient => {
    return async (req, res) => {
      const breach = await getBreachInfo(hmppsAuthClient, req, res)
      return res.render('pages/appointment-outcomes/outcome', { breach })
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
      const { crn, isValidParams, id, uuid, contactId, baseOutcomeUrl } = res.locals.appointmentOutcome
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
      const path = contactId ? baseOutcomeUrl : `/case/${crn}/arrange-appointment/${id}`
      const redirect = `${path}/check-your-answers`
      return res.redirect(change ?? redirect)
    }
  },
  getCheckYourAnswers: _hmppsAuthClient => {
    return async (req, res) => {
      const url = encodeURIComponent(req.url)
      res.render('pages/appointment-outcomes/check-your-answers', { url })
    }
  },
  postCheckYourAnswers: _hmppsAuthClient => {
    return async (_req, res) => {
      const { id, crn } = res.locals.appointmentOutcome
      return res.redirect(`/case/${crn}/appointments/appointment/${id}/manage`)
    }
  },
  getAttendedFailedToComply: hmppsAuthClient => {
    return async (req, res) => {
      const breach = await getBreachInfo(hmppsAuthClient, req, res)
      return res.render('pages/appointment-outcomes/attended-failed-to-comply', { breach })
    }
  },

  getUnacceptableAbsence: hmppsAuthClient => {
    return async (req, res) => {
      const breach = await getBreachInfo(hmppsAuthClient, req, res)
      return res.render('pages/appointment-outcomes/unacceptable-absence', { breach })
    }
  },
  getFailedToAttend: hmppsAuthClient => {
    return async (req, res) => {
      const breach = await getBreachInfo(hmppsAuthClient, req, res)
      return res.render('pages/appointment-outcomes/failed-to-attend', { breach })
    }
  },
  getEnforcementAction: hmppsAuthClient => {
    return async (req, res) => {
      const breach = await getBreachInfo(hmppsAuthClient, req, res)
      return res.render('pages/appointment-outcomes/enforcement-action', { breach })
    }
  },
  getInitiateBreachOrRecall: hmppsAuthClient => {
    return async (req, res) => {
      const breach = await getBreachInfo(hmppsAuthClient, req, res)
      return res.render('pages/appointment-outcomes/initiate-breach-or-recall', { breach })
    }
  },
  getSendLetter: hmppsAuthClient => {
    return async (req, res) => {
      const breach = await getBreachInfo(hmppsAuthClient, req, res)
      return res.render('pages/appointment-outcomes/send-letter', { breach })
    }
  },
  getUpdateEnforcementAction: hmppsAuthClient => {
    return async (req, res) => {
      const breach = await getBreachInfo(hmppsAuthClient, req, res)
      return res.render('pages/appointment-outcomes/update-enforcement-action', { breach })
    }
  },
  getAcceptableAbsence: hmppsAuthClient => {
    return async (req, res) => {
      const breach = await getBreachInfo(hmppsAuthClient, req, res)
      return res.render('pages/appointment-outcomes/acceptable-absence', { breach })
    }
  },
}

export default appointmentOutcomesController
