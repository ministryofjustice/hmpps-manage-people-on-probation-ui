import { Controller, FileCache } from '../@types'
import { getDataValue, isValidCrn } from '../utils'

import { cloneAppointment, cloneAppointmentAndRedirect, renderError } from '../middleware'
import config from '../config'
import MasApiClient from '../data/masApiClient'

const routes = ['redirectToRescheduleAppointment', 'getRescheduleAppointment', 'postRescheduleAppointment'] as const

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
      const token = await _hmppsAuthClient.getSystemClientToken(res.locals.user.username)
      const masClient = new MasApiClient(token)
      const [personAppointment] = await Promise.all([masClient.getPersonAppointment(crn, contactId)])
      const { validMimeTypes, maxFileSize, fileUploadLimit, maxCharCount } = config

      res.render('pages/appointments/reschedule-appointment', {
        crn,
        maxCharCount,
        personAppointment,
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
      const { crn, id } = req.params
      if (!isValidCrn(crn)) {
        return renderError(404)(req, res)
      }
      /*      if (req.session?.data?.appointments?.[crn]?.[id]) {
        delete req.session.data.appointments[crn][id]
      } */
      const redirect = `/case/${crn}/arrange-appointment/${id}/check-your-answers`
      return res.redirect(redirect)
    }
  },
}

export default rescheduleAppointmentController
