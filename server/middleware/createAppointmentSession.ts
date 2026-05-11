import { Request, NextFunction } from 'express'
import { AppResponse } from '../models/Locals'
import { isoToDateTime, setDataValue } from '../utils'
import { AppointmentSession, AppointmentSessionSelection, YesNo } from '../models/Appointments'

const booleanToYesNo = (answer: boolean): YesNo => (answer === true ? 'Yes' : 'No')

export const createAppointmentSession = (req: Request, res: AppResponse, next: NextFunction) => {
  const { appointment } = res.locals.personAppointment
  const { crn, id, contactId } = req.params as Record<string, string>
  const selection: AppointmentSessionSelection = req?.body?.nextAppointment || 'KEEP_TYPE'
  let appointmentSession: AppointmentSession = {
    eventId: '',
    username: res.locals.user.username,
    uuid: '',
  }
  if (['KEEP_TYPE', 'RESCHEDULE'].includes(selection)) {
    if (selection === 'RESCHEDULE') {
      appointmentSession.rescheduleAppointment = {
        ...(req?.session?.data?.appointments?.[crn]?.[id]?.rescheduleAppointment ?? {}),
        previousStart: appointment.startDateTime,
        previousEnd: appointment.endDateTime,
      }
    }
    const { appointmentTypes } = res.locals
    let eventId = appointment?.eventId || ''
    const sentences = req?.session?.data?.sentences?.[crn]
    if (!eventId && appointment?.eventNumber) {
      if (sentences) {
        eventId = sentences.find(sentence => sentence?.eventNumber === appointment.eventNumber)?.id || ''
      }
    }
    if (eventId && !sentences.some(sentence => sentence.id.toString() === eventId.toString())) {
      eventId = ''
    }
    const matchingType = appointmentTypes.find(t => t?.description === appointment?.type)
    let type = matchingType?.code || ''
    if (!eventId && matchingType?.isPersonLevelContact === true) {
      eventId = 'PERSON_LEVEL_CONTACT'
    }
    let locationCode = appointment?.location?.code || ''
    if (matchingType?.isLocationRequired === false && !locationCode) {
      locationCode = 'NO_LOCATION_REQUIRED'
    }
    let username = appointment?.officer?.username || ''
    let teamCode = appointment?.officer?.teamCode || ''
    const staffCode = appointment?.officer?.code || ''
    let providerCode = appointment?.officer?.providerCode || ''
    const visorReport = appointment?.isVisor !== undefined ? booleanToYesNo(appointment.isVisor) : ''
    let date = ''
    let start = ''
    let end = ''
    let sensitivity: YesNo | undefined
    let sensitivityLocked: boolean | undefined
    if (appointment?.startDateTime) {
      ;({ date, time: start } = isoToDateTime(appointment.startDateTime))
    }
    if (appointment?.endDateTime) {
      ;({ time: end } = isoToDateTime(appointment.endDateTime))
    }
    const externalReference = appointment?.externalReference || ''
    const enforcementAction = appointment?.enforcementAction || null
    if (!eventId) {
      type = ''
    }
    if (!providerCode || !teamCode || !username) {
      providerCode = ''
      teamCode = ''
      username = ''
    }
    if (!eventId || !type || !providerCode || !teamCode || !username) {
      locationCode = ''
    }
    if (selection === 'RESCHEDULE') {
      sensitivity = res.locals.flags?.enableSensitivityRemoved && appointment.isSensitive ? 'Yes' : undefined
      if (sensitivity === 'Yes') {
        sensitivityLocked = true
      }
    }
    appointmentSession = {
      ...appointmentSession,
      user: {
        providerCode,
        teamCode,
        username,
        locationCode,
        staffCode,
      },
      type,
      date,
      start,
      end,
      eventId: eventId?.toString(),
      username: res.locals.user.username,
      uuid: '',
      externalReference,
      enforcementAction,
      sensitivity,
      sensitivityLocked,
    }
    if (visorReport) {
      appointmentSession.visorReport = visorReport
    }
    if (appointment?.component?.type === 'REQUIREMENT') {
      appointmentSession.requirementId = appointment?.component?.id.toString() || ''
    }
    if (appointment?.component?.type === 'LICENCE_CONDITION') {
      appointmentSession.licenceConditionId = appointment?.component?.id?.toString() || ''
    }
    if (appointment?.nsiId) {
      appointmentSession.nsiId = appointment.nsiId.toString()
    }
    if (appointment?.officer?.name) {
      appointmentSession.user.name = appointment.officer.name
    }
    appointmentSession.smsOptIn = null
  }

  /*

  Get outcome and enforcement action from appointment - not needed ?
 
  const outcome = appointment?.outcome
  const action = appointment?.action
  if (res?.locals?.appointmentOutcome?.appointmentSession?.outcome?.contactOutcomes && outcome) {
    // match the appointment.outcome to contactOutcome.description
    const contactOutcome = res.locals.appointmentOutcome.appointmentSession.outcome.contactOutcomes.find(
      _outcome => _outcome.description === outcome,
    )
    if (contactOutcome) {
      const outcomeType = Object.entries(outcomeMap).find(
        ([_key, { code }]) => contactOutcome.code === code,
      )?.[0] as AppointmentOutcomeType
    }
  }
  if (res?.locals?.appointmentOutcome?.appointmentSession?.outcome?.contactEnforcementActions && action) {
    // match the appointment.action to contactEnforcementActions.description
    const contactEnforcementAction =
      res.locals.appointmentOutcome.appointmentSession.outcome.contactEnforcementActions.find(
        _action => _action.description === outcome,
      )
    if (contactEnforcementAction) {
      // map action to outcome page
      const enforcementAction = Object.entries(enforcementActionMap).find(
        ([_key, { code }]) => contactEnforcementAction.code === code,
      )?.[0] as AppointmentEnforcementAction
      if (enforcementAction) {
        const pageKey = camelCase(enforcementAction)
      }
    }
  }

  */

  res.locals.appointmentSession = appointmentSession
  if (contactId) {
    setDataValue(req.session.data, ['appointments', crn, contactId], appointmentSession)
  }
  return next()
}
