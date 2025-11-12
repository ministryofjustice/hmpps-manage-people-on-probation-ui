/* eslint-disable no-underscore-dangle */
import { DateTime } from 'luxon'
import { Route } from '../../@types'
import { dateIsInPast, getDataValue, getPersonLevelTypes } from '../../utils'
import { appointmentsValidation } from '../../properties'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/Appointments'
import config from '../../config'
import { getMockedTime } from '../../routes/testRoutes'

const appointments: Route<void> = (req, res, next) => {
  const { url, params, body, session } = req
  const { crn, id, contactId, actionType } = params
  const { data, alertDismissed = false } = session
  const { back = '', change = '' } = req.query as Record<string, string>
  const { maxCharCount } = config
  const eventId = getDataValue(data, ['appointments', crn, id, 'eventId'])
  const personLevel = eventId === 'PERSON_LEVEL_CONTACT'
  const date = body?.appointments?.[crn]?.[id]?.date
  const start = body?.appointments?.[crn]?.[id]?.start
  let isInPast = false
  if (date) {
    const dt = DateTime.fromFormat(date, 'd/M/yyyy')
    if (dt.isValid) {
      ;({ isInPast } = dateIsInPast(dt.toFormat('yyyy-M-d'), start))
    }
  }
  const localParams: LocalParams = {
    crn,
    id,
    body,
    contactId,
    actionType,
    personLevel,
    maxCharCount,
    back,
    change,
    isInPast,
    alertDismissed,
  }
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

  const validateLocationDateTime = (): void => {
    if (baseUrl.includes('/location-date-time')) {
      localParams._minDate = req.body._minDate
      localParams._maxDate = req.body._maxDate
      const now = getMockedTime() ? DateTime.fromISO(getMockedTime()!) : DateTime.now()
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'location-date-time',
        }),
        { now },
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
    if (req.url.includes(`/case/${crn}/arrange-appointment/${id}/attended-complied`)) {
      render = `pages/appointments/attended-complied`
      errorMessages = validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'attended-complied',
        }),
      )
    }
  }

  const validateManageAttendedComplied = () => {
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
  validateLocationDateTime()
  validateRepeating()
  validateSupportingInformation()
  validateNextAppointment()
  validateRecordAnOutcome()
  validateAttendedComplied()
  validateManageAttendedComplied()
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
