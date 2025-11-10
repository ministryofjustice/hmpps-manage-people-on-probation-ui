import { v4 as uuidv4 } from 'uuid'
import { Controller, FileCache } from '../@types'
import { isValidCrn } from '../utils'

import { cloneAppointmentAndRedirect, renderError } from '../middleware'
import config from '../config'

const routes = [
  'redirectToRescheduleAppointment',
  'getRescheduleAppointment',
  'postRescheduleAppointment',
  'getRescheduleCheckYourAnswer',
] as const

const rescheduleAppointmentController: Controller<typeof routes, void> = {
  redirectToRescheduleAppointment: () => {
    return async (req, res) => {
      const { crn, contactId } = req.params
      if (!isValidCrn(crn)) {
        return renderError(404)(req, res)
      }
      // New id for reschedule appointment journey
      const uuid = uuidv4()
      return res.redirect(`/case/${crn}/appointments/reschedule/${contactId}/${uuid}`)
    }
  },
  getRescheduleAppointment: _hmppsAuthClient => {
    return async (req, res) => {
      let uploadedFiles: FileCache[] = []
      let errorMessages: Record<string, string> = null
      let body = null
      if (req?.session?.cache?.uploadedFiles) {
        uploadedFiles = req.session.cache.uploadedFiles
        delete req.session.cache.uploadedFiles
      }
      if (req?.session?.errorMessages) {
        errorMessages = req.session.errorMessages
        res.locals.errorMessages = req.session.errorMessages
        delete req.session.errorMessages
      }
      if (req?.session?.body) {
        body = req.session.body
        delete req.session.body
      }

      const per = res.locals.personAppointment
      const { validation } = req.query
      const showValidation = validation === 'true'
      const { crn, id, contactId } = req.params as Record<string, string>
      if (showValidation) {
        res.locals.errorMessages = {
          [`appointments-${crn}-${id}-sensitivity`]: 'Select if appointment includes sensitive information',
          [`appointments-${crn}-${id}-rescheduleAppointment-reason`]:
            'Explain why this appointment is being rescheduled',
          [`appointments-${crn}-${id}-rescheduleAppointment-whoNeedsToReschedule`]:
            'Select who is rescheduling this appointment',
        }
      }

      const { validMimeTypes, maxFileSize, fileUploadLimit, maxCharCount } = config
      res.render('pages/reschedule/appointment', {
        crn,
        maxCharCount,
        contactId,
        validMimeTypes: Object.entries(validMimeTypes).map(([_key, value]) => value),
        maxFileSize,
        fileUploadLimit,
        body,
        uploadedFiles,
        id,
        showValidation,
        errorMessages,
      })
    }
  },
  postRescheduleAppointment: hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id, contactId } = req.params
      if (!isValidCrn(crn)) {
        return renderError(404)(req, res)
      }
      const { nextAppointmentSession } = res.locals
      return cloneAppointmentAndRedirect(nextAppointmentSession, 'RESCHEDULE')(req, res)
    }
  },
  getRescheduleCheckYourAnswer: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id, contactId } = req.params
      const { url } = req
      res.render('pages/reschedule/check-your-answers', {
        crn,
        id,
        contactId,
        url,
      })
    }
  },
}

export default rescheduleAppointmentController
