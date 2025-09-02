/* eslint-disable no-underscore-dangle */
import { Route } from '../../@types'
import { getDataValue } from '../../utils'
import { appointmentsValidation } from '../../properties'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/Appointments'

const appointments: Route<void> = (req, res, next) => {
  const { url, params, body } = req
  const { crn, id } = params
  const localParams: LocalParams = { crn, id, body }
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
    if (req.url.includes('/type')) {
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({ crn, id, page: 'type', visor: req?.body?.visor }),
      )
    }
  }

  const validateSentence = (): void => {
    if (req.url.includes('/sentence')) {
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
    if (req.url.includes('/location')) {
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
    if (req.url.includes('/date-time')) {
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
    if (req.url.includes('/repeating')) {
      const repeatingValue = req.body?.appointments?.[crn]?.[id]?.repeating
      const { data } = req.session
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

  const validateSensitivity = () => {
    if (req.url.includes('/add-notes')) {
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'add-notes',
        }),
      )
    }
  }


  const validateNextAppointment = () => {
    if (req.url.includes('/next-appointment')) {
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

  const validateRecordAnOutcome = () => {
    const { contactId } = req.params
    if (req.url.includes(`appointment/${contactId}/record-an-outcome`)) {
      render = `pages/appointments/record-an-outcome`
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'record-an-outcome',
        }),
      )
    }
  }

  const validateAddNote = () => {
    const { contactId } = req.params
    if (req.url.includes(`/case/${crn}/appointments/appointment/${contactId}/add-note`)) {
      isAddNotePage = true
      render = `pages/appointments/add-note`
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'add-note',
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
  validateSensitivity()
  validateNextAppointment()
  validateRecordAnOutcome()
  validateAddNote()
  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    if (isAddNotePage) {
      req.session.errorMessages = errorMessages
      return res.redirect(req.url)
    }
    return res.render(render, { errorMessages, ...localParams })
  }
  return next()
}

export default appointments
