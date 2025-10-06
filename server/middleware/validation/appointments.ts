/* eslint-disable no-underscore-dangle */
import { Route } from '../../@types'
import { getDataValue, getPersonLevelTypes } from '../../utils'
import { appointmentsValidation } from '../../properties'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/Appointments'
import config from '../../config'

const appointments: Route<void> = (req, res, next) => {
  const { url, params, body, session } = req
  const { crn, id, contactId, actionType } = params
  const { data } = session
  let { back, change } = req.query
  back = back ? back.toString() : ''
  change = change ? change.toString() : ''
  const { maxCharCount } = config
  const eventId = getDataValue(data, ['appointments', crn, id, 'eventId'])
  const personLevel = eventId === 'PERSON_LEVEL_CONTACT'
  const localParams: LocalParams = { crn, id, body, contactId, actionType, personLevel, maxCharCount, back, change }
  const baseUrl = req.url.split('?')[0]
  let isAddNotePage = false
  let render = `pages/${[
    url
      .split('?')[0]
      .split('/')
      .filter(item => item)
      .filter((_item, i) => ![0, 1, 3].includes(i))
      .join('/'),
  ]}`

  const validateType = (): void => {
    if (baseUrl.includes('/type')) {
      if (personLevel) {
        res.locals.appointmentTypes = getPersonLevelTypes(res.locals.appointmentTypes)
      }
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({ crn, id, page: 'type', visor: req?.body?.visor }),
      )
    }
  }

  const validateSentence = (): void => {
    if (baseUrl.includes('/sentence')) {
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'sentence',
        }),
      )
    }
  }

  const validateLocation = (): void => {
    if (baseUrl.includes('/location')) {
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'location',
        }),
      )
    }
  }

  const validateDateTime = (): void => {
    if (baseUrl.includes('/date-time')) {
      localParams._minDate = req.body._minDate
      localParams._maxDate = req.body._maxDate
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'datetime',
        }),
      )
    }
  }

  const validateRepeating = () => {
    if (baseUrl.includes('/repeating')) {
      const repeatingValue = req.body?.appointments?.[crn]?.[id]?.repeating
      const appointmentDate = getDataValue(data, ['appointments', crn, id, 'date'])
      const appointmentRepeatingDates = getDataValue(data, ['appointments', crn, id, 'repeatingDates'])
      const oneYearFromDate = new Date(appointmentDate)
      oneYearFromDate.setFullYear(oneYearFromDate.getFullYear() + 1)
      let finalAppointmentDate = null
      let isMoreThanAYear = false
      if (appointmentRepeatingDates) {
        finalAppointmentDate = appointmentRepeatingDates[appointmentRepeatingDates.length - 1]
        isMoreThanAYear = new Date(finalAppointmentDate) > oneYearFromDate
      }
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'repeating',
          repeatingValue,
        }),
      )
      if (isMoreThanAYear) {
        errorMessages = {
          ...errorMessages,
          [`appointments-${crn}-${id}-interval`]: 'The appointment can only repeat up to a year',
        }
      }
    }
  }

  const validateRecordAnOutcome = () => {
    if (baseUrl.includes(`case/${crn}/record-an-outcome`)) {
      render = `pages/appointments/record-an-outcome`
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          contactId,
          page: 'record-an-outcome',
        }),
      )
    }
  }

  const validateAttendedComplied = () => {
    if (req.url.includes(`appointment/${contactId}/attended-complied`)) {
      render = `pages/appointments/attended-complied`
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          contactId,
          page: 'attended-complied',
        }),
      )
    }
  }

  const validateSupportingInformation = () => {
    if (baseUrl.includes('/supporting-information')) {
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          contactId,
          page: 'supporting-information',
          notes: req.body.appointments[crn][id].notes,
          maxCharCount,
        }),
      )
    }
  }

  const validateNextAppointment = () => {
    if (baseUrl.includes('/next-appointment')) {
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'next-appointment',
        }),
      )
      render = 'pages/appointments/next-appointment'
    }
  }

  const validateAddNote = () => {
    if (baseUrl.includes(`/case/${crn}/appointments/appointment/${contactId}/add-note`)) {
      isAddNotePage = true
      render = `pages/appointments/add-note`
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'add-note',
          notes: req.body.notes,
          maxCharCount,
        }),
      )
    }
  }

  let errorMessages: Record<string, string> = {}
  validateType()
  validateSentence()
  validateLocation()
  validateDateTime()
  validateRepeating()
  validateSupportingInformation()
  validateNextAppointment()
  validateRecordAnOutcome()
  validateAttendedComplied()
  validateAddNote()
  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    if (isAddNotePage) {
      req.session.errorMessages = errorMessages
      req.session.body = body
      return res.redirect(req.url)
    }
    return res.render(render, { errorMessages, ...localParams })
  }
  return next()
}

export default appointments
