import { Controller, FileCache } from '../@types'
import { getDataValue, isValidCrn, setDataValue } from '../utils'

import { cloneAppointment, cloneAppointmentAndRedirect, renderError } from '../middleware'
import config from '../config'
import MasApiClient from '../data/masApiClient'

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
      const { nextAppointmentSession } = res.locals
      const redirect = cloneAppointment(nextAppointmentSession)(req, res)
      return res.redirect(redirect)
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
      /*      if (req.session?.data?.appointments?.[crn]?.[id]) {
        delete req.session.data.appointments[crn][id]
      } */
      const redirect = `/case/${crn}/appointments/reschedule/${contactId}/${id}/check-answers`
      return res.redirect(redirect)
      // return res.render('pages/appointments/reschedule-check-your-answers',{})
    }
  },
  getRescheduleCheckYourAnswer: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id, contactId } = req.params

      res.render('pages/reschedule/check-your-answers', {
        crn,
        id,
        contactId,
      })
    }
  },
}

export default rescheduleAppointmentController
