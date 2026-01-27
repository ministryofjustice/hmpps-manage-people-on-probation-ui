/* eslint-disable no-underscore-dangle */
import { DateTime } from 'luxon'
import { Route } from '../../@types'
import { getDataValue, getPersonLevelTypes, unflattenBracketKeys } from '../../utils'
import { appointmentsValidation } from '../../properties'
import { appointmentDateIsInPast } from '../appointmentDateIsInPast'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/Appointments'
import config from '../../config'
import { getMockedTime } from '../../routes/testRoutes'
import { getAttendedCompliedProps } from '../getAttendedCompliedProps'
import { isRescheduleAppointment } from '../isRescheduleAppointment'
import { getMinMaxDates } from '../../utils/getMinMaxDates'
import { urlToRenderPath } from '../../utils/urlToRenderPath'

const appointments: Route<void> = (req, res, next) => {
  const { params, body, session } = req
  const { crn, id, contactId, actionType } = params
  const { data, alertDismissed = false } = session
  const { back = '', change = '' } = req.query as Record<string, string>
  const { maxCharCount } = config

  req.body.fileOrNote = req.file || res?.locals?.errorMessages?.fileUpload ? 'has_file' : req.body.notes

  const eventId = getDataValue(data, ['appointments', crn, id, 'eventId'])
  const personLevel = eventId === 'PERSON_LEVEL_CONTACT'

  let localParams: LocalParams = {
    crn,
    id,
    body,
    contactId,
    actionType,
    personLevel,
    maxCharCount: maxCharCount as number,
    back,
    change,
    alertDismissed,
  }

  if (
    [`/arrange-appointment/${id}/attended-complied`, '/location-date-time'].some(urlPart => req.url.includes(urlPart))
  ) {
    const { enablePastAppointments } = res.locals.flags
    const { _minDate, _maxDate } = getMinMaxDates()

    localParams = {
      ...localParams,
      isReschedule: isRescheduleAppointment(req),
      isInPast: appointmentDateIsInPast(req),
      ...(enablePastAppointments ? {} : { _minDate }),
      _maxDate,
    }
  }

  if (req.url.includes('/attended-complied')) {
    localParams = { ...localParams, ...getAttendedCompliedProps(req, res) }
  }

  if (
    [`/arrange-appointment/${id}/attended-complied`, `/arrange-appointment/${id}/add-note`].some(urlPart =>
      req.url.includes(urlPart),
    )
  ) {
    localParams = { ...localParams, useDecorator: true }
  }

  const baseUrl = req.url.split('?')[0]
  let isAddNotePage: boolean
  let render = res?.locals?.renderPath || urlToRenderPath(req, res)
  let errorMessages = res?.locals?.errorMessages || {}

  const validateType = (): void => {
    if (!baseUrl.includes('/type')) return

    if (personLevel) {
      res.locals.appointmentTypes = getPersonLevelTypes(res.locals.appointmentTypes)
    }

    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'type',
          visor: req?.body?.visor,
        }),
      ),
    }
  }

  const validateSentence = (): void => {
    if (!baseUrl.includes('/sentence')) return

    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'sentence',
        }),
      ),
    }
  }

  const validateLocationDateTime = (): void => {
    if (!baseUrl.includes('/location-date-time')) return

    localParams._minDate = req.body._minDate
    localParams._maxDate = req.body._maxDate

    const now = getMockedTime() ? DateTime.fromISO(getMockedTime()!) : DateTime.now()

    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'location-date-time',
          enablePastAppointments: res.locals.flags.enablePastAppointments,
        }),
        { now },
      ),
    }
  }

  const validateRepeating = (): void => {
    if (!baseUrl.includes('/repeating')) return

    const repeatingValue = req.body?.appointments?.[crn]?.[id]?.repeating
    const appointmentDate = getDataValue(data, ['appointments', crn, id, 'date'])
    const appointmentRepeatingDates = getDataValue(data, ['appointments', crn, id, 'repeatingDates'])

    const oneYearFromDate = new Date(appointmentDate)
    oneYearFromDate.setFullYear(oneYearFromDate.getFullYear() + 1)

    let isMoreThanAYear = false

    if (appointmentRepeatingDates?.length) {
      const finalAppointmentDate = appointmentRepeatingDates.at(-1)
      isMoreThanAYear = new Date(finalAppointmentDate) > oneYearFromDate
    }

    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'repeating',
          repeatingValue,
        }),
      ),
    }

    if (isMoreThanAYear) {
      errorMessages = {
        ...errorMessages,
        [`appointments-${crn}-${id}-interval`]: 'The appointment can only repeat up to a year',
      }
    }
  }

  const validateRecordAnOutcome = (): void => {
    if (!baseUrl.includes(`case/${crn}/record-an-outcome`)) return

    render = 'pages/appointments/record-an-outcome'

    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          contactId,
          page: 'record-an-outcome',
        }),
      ),
    }
  }

  const validateAttendedComplied = (): void => {
    if (!req.url.includes(`/case/${crn}/arrange-appointment/${id}/attended-complied`)) return

    render = 'pages/appointments/attended-complied'

    errorMessages = validateWithSpec(
      req.body,
      appointmentsValidation({
        crn,
        id,
        page: `arrange-appointment/${id}/attended-complied`,
      }),
    )
  }

  const validateManageAttendedComplied = (): void => {
    if (!req.url.includes(`appointment/${contactId}/attended-complied`)) return

    render = 'pages/appointments/attended-complied'

    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          contactId,
          page: `appointment/${contactId}/attended-complied`,
        }),
      ),
    }
  }

  const validateSupportingInformation = (): void => {
    if (!baseUrl.includes('/supporting-information')) return

    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          contactId,
          page: 'supporting-information',
          notes: req.body.appointments[crn][id].notes,
          maxCharCount: maxCharCount as number,
        }),
      ),
    }
  }

  const validateNextAppointment = (): void => {
    if (!baseUrl.includes('/next-appointment')) return

    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'next-appointment',
        }),
      ),
    }

    render = 'pages/appointments/next-appointment'
  }

  const validateAddNote = (): void => {
    if (!baseUrl.includes(`/case/${crn}/arrange-appointment/${id}/add-note`)) return

    isAddNotePage = true
    render = 'pages/appointments/add-note'

    errorMessages = validateWithSpec(
      req.body,
      appointmentsValidation({
        crn,
        id,
        page: `arrange-appointment/${id}/add-note`,
        notes: req.body.appointments[crn][id].notes,
        maxCharCount: maxCharCount as number,
      }),
    )
  }

  const validateManageAddNote = (): void => {
    if (!baseUrl.includes(`/case/${crn}/appointments/appointment/${contactId}/add-note`)) return

    isAddNotePage = true
    render = 'pages/appointments/add-note'

    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          contactId,
          page: `appointment/${contactId}/add-note`,
          notes: req.body.notes,
          fileOrNote: req.body.fileOrNote,
          maxCharCount: maxCharCount as number,
        }),
      ),
    }
  }

  const validateReschedule = () => {
    if (baseUrl.includes(`/case/${crn}/appointments/reschedule/${contactId}/${id}`)) {
      render = `pages/reschedule/appointment`
      errorMessages = {
        ...errorMessages,
        ...validateWithSpec(
          unflattenBracketKeys(req.body),
          appointmentsValidation({
            crn,
            id,
            page: 'reschedule-appointment',
            maxCharCount: maxCharCount as number,
          }),
        ),
      }
    }
  }

  const validateTextMessageConfirmation = () => {
    if (!baseUrl.includes(`/case/${crn}/arrange-appointment/${id}/text-message-confirmation`)) return
    render = 'pages/arrange-appointment/text-message-confirmation'
    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req.body,
        appointmentsValidation({
          crn,
          id,
          page: 'text-message-confirmation',
        }),
      ),
    }
  }

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
  validateManageAddNote()
  validateReschedule()
  validateTextMessageConfirmation()
  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    return res.render(render, { errorMessages, ...localParams })
  }

  return next()
}

export default appointments
