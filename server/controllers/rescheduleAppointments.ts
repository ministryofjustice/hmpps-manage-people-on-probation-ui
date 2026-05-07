import { v4 as uuidv4 } from 'uuid'
import { Controller, FileCache } from '../@types'
import { getDataValue, isValidCrn, isValidUUID } from '../utils'

import { appointmentDateIsInPast, cloneAppointmentAndRedirect, renderError } from '../middleware'
import config from '../config'
import sendAuditMessage, { SubjectType } from '../middleware/sendAuditMessage'

const routes = [
  'redirectToRescheduleAppointment',
  'getRescheduleAppointment',
  'postRescheduleAppointment',
  'getRescheduleCheckYourAnswer',
] as const

const rescheduleAppointmentController: Controller<typeof routes, void> = {
  redirectToRescheduleAppointment: () => {
    return async (req, res) => {
      const { crn, contactId } = req.params as Record<string, string>
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

      const { validation } = req.query
      const showValidation = validation === 'true'
      const { crn, id, contactId } = req.params as Record<string, string>
      await sendAuditMessage(res, 'ADD_MAS_RESCHEDULE_APPOINTMENT', crn, SubjectType.CRN)
      if (showValidation) {
        res.locals.errorMessages = {
          [`appointments-${crn}-${id}-sensitivity`]: 'Select if appointment includes sensitive information',
          [`appointments-${crn}-${id}-rescheduleAppointment-reason`]:
            'Explain why this appointment is being rescheduled',
          [`appointments-${crn}-${id}-rescheduleAppointment-whoNeedsToReschedule`]:
            'Select who is rescheduling this appointment',
        }
      }
      const isSensitive = res.locals.personAppointment?.appointment?.isSensitive

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
        isSensitive,
      })
    }
  },
  postRescheduleAppointment: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id } = req.params as Record<string, string>
      if (!isValidCrn(crn) || !isValidUUID(id)) {
        return renderError(404)(req, res)
      }
      const { appointmentSession } = res.locals
      return cloneAppointmentAndRedirect(appointmentSession, 'RESCHEDULE')(req, res)
    }
  },
  getRescheduleCheckYourAnswer: _hmppsAuthClient => {
    return async (req, res) => {
      const { crn, id, contactId } = req.params as Record<string, string>
      const { data } = req.session
      const isInPast = appointmentDateIsInPast(req)
      const sensitivityLocked = getDataValue(data, ['appointments', crn, id, 'sensitivityLocked'])
      await sendAuditMessage(res, 'VIEW_MAS_CHANGE_APPOINTMENT_DETAILS_AND_RESCHEDULE', crn, SubjectType.CRN)
      const { url } = req
      res.render('pages/reschedule/check-your-answers', {
        crn,
        id,
        contactId,
        url,
        isInPast,
        sensitivityLocked,
      })
    }
  },
}

export default rescheduleAppointmentController
