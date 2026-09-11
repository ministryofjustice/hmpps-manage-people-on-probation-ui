/* eslint-disable no-underscore-dangle */
import { DateTime } from 'luxon'
import { Request } from 'express'
import { Route } from '../../@types'
import { getDataValue, getPersonLevelTypes, unflattenBracketKeys } from '../../utils'
import { appointmentsValidation } from '../../properties'
import { appointmentDateIsInPast } from '../appointmentDateIsInPast'
import { validateWithSpec } from '../../utils/validationUtils'
import { LocalParams } from '../../models/Appointments'
import config from '../../config'
import { getMockedTime } from '../../routes/testRoutes'
import { isRescheduleAppointment } from '../isRescheduleAppointment'
import { getMinMaxDates } from '../../utils/getMinMaxDates'
import { urlToRenderPath } from '../../utils/urlToRenderPath'

const appointments: Route<void> = (req, res, next) => {
  const { params, body, session } = req
  const { crn, id: uuid, contactId, actionType } = params as Record<string, string>
  const id = uuid || contactId
  const { data, alertDismissed = false } = session
  const { back = '', change = '' } = req.query as Record<string, string>
  const { maxCharCount } = config
  const outcomeJourney = req.url.includes('outcome/next-appointment')

  req.body.fileOrNote = req.file || res?.locals?.errorMessages?.fileUpload ? 'has_file' : req.body.notes

  if (req.query.filter === 'true') {
    return next()
  }

  const eventId = getDataValue(data, ['appointments', crn, id, 'eventId'])
  const personLevel = eventId === 'PERSON_LEVEL_CONTACT'
  const sensitivityLocked = getDataValue(data, ['appointments', crn, id, 'sensitivityLocked'])
  const isSensitive = sensitivityLocked ?? res.locals.personAppointment?.appointment?.isSensitive

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
    isSensitive,
    outcomeJourney,
  }

  if (req.url.includes('/location-date-time')) {
    const { _maxDate } = getMinMaxDates()

    localParams = {
      ...localParams,
      isReschedule: isRescheduleAppointment(req),
      isInPast: appointmentDateIsInPast(req, res),
      _maxDate,
    }
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
        req,
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
        req,
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
        req,
        appointmentsValidation({
          crn,
          id,
          page: 'location-date-time',
          previousStart: req?.session?.data?.appointments?.[crn]?.[id]?.rescheduleAppointment?.previousStart || null,
        }),
        { now },
      ),
    }
  }

  const validateRecordAnOutcome = (): void => {
    if (!baseUrl.includes(`case/${crn}/record-an-outcome`)) return

    render = 'pages/appointments/record-an-outcome'

    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req,
        appointmentsValidation({
          crn,
          id,
          contactId,
          page: 'record-an-outcome',
        }),
      ),
    }
  }

  const validateSupportingInformation = (): void => {
    if (!baseUrl.includes('/supporting-information')) return

    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req,
        appointmentsValidation({
          crn,
          id,
          contactId,
          page: 'supporting-information',
          notes: unflattenBracketKeys(req.body || {})?.appointments?.[crn]?.[id]?.notes ?? '',
          maxCharCount: maxCharCount as number,
          isSensitive,
        }),
      ),
    }
  }

  const validateNextAppointment = (): void => {
    if (!baseUrl.includes('/next-appointment')) return

    errorMessages = {
      ...errorMessages,
      ...validateWithSpec(
        req,
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
      req,
      appointmentsValidation({
        crn,
        id,
        page: `arrange-appointment/${id}/add-note`,
        notes: req?.body?.appointments?.[crn]?.[id]?.notes || '',
        maxCharCount: maxCharCount as number,
        isSensitive,
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
        req,
        appointmentsValidation({
          crn,
          id,
          contactId,
          page: `appointment/${contactId}/add-note`,
          notes: req.body.notes,
          fileOrNote: req.body.fileOrNote,
          maxCharCount: maxCharCount as number,
          isSensitive,
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
          { ...req, body: unflattenBracketKeys(req.body) } as Request,
          appointmentsValidation({
            crn,
            id,
            page: 'reschedule-appointment',
            maxCharCount: maxCharCount as number,
            isSensitive,
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
        req,
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
  validateSupportingInformation()
  validateNextAppointment()
  validateRecordAnOutcome()
  validateAddNote()
  validateManageAddNote()
  validateReschedule()
  validateTextMessageConfirmation()
  if (Object.keys(errorMessages).length) {
    res.locals.errorMessages = errorMessages
    if (req.query.filter === 'false') {
      return next()
    }
    return res.render(render, { errorMessages, ...localParams })
  }
  return next()
}

export default appointments
