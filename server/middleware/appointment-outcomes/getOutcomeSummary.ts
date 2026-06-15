import { DateTime } from 'luxon'
import { Route } from '../../@types'
import {
  dateWithDayAndWithYear,
  dateWithYear,
  getContactEnforcementActions,
  getMappedActions,
  getMappedOutcome,
  govukTime,
  toSentenceCase,
} from '../../utils'
import { outcomeRedirectMap } from '../../properties/appointment-outcomes/outcome-redirect-map'
import { Activity } from '../../data/model/schedule'
import { AppointmentOutcomeProps, OutcomeSummary } from '../../models/Locals'

export const getOutcomeSummary: Route<void> = (_req, res, next) => {
  let summary: OutcomeSummary
  if (res?.locals?.appointmentOutcome?.appointmentSession?.outcome) {
    const {
      notePrepend,
      baseOutcomeUrl,
      appointmentSession: {
        notes,
        sensitivity,
        date,
        outcome: {
          contactOutcomes,
          outcomeType,
          outcomeCode,
          enforcementActionCode,
          attendedFailedToComply,
          unacceptableAbsence,
          failedToAttend,
          letterSentBy,
          letterType,
          breachNSICreatedBy,
        },
      },
      appointment,
    } = res.locals.appointmentOutcome as AppointmentOutcomeProps<Activity>
    const nextAppt = res?.locals?.nextAppointment?.appointment
    let nextAppointment: string = 'No next appointment'
    let type: string
    let startDateTime: string
    let endDateTime: string
    if (nextAppt) {
      ;({ type, startDateTime, endDateTime } = nextAppt)
      nextAppointment = `${type} on ${dateWithDayAndWithYear(startDateTime)} at ${govukTime(startDateTime)} to ${govukTime(endDateTime)}`
    }

    const noOutcome = 'No outcome'
    const noAction = 'No enforcement action'

    const getSelectedOutcome = (): string => {
      if (!outcomeCode) return noOutcome
      const selected = getMappedOutcome({ code: outcomeCode })
      return selected?.[1]?.description ? toSentenceCase(selected[1].description) : noOutcome
    }

    const getSelectedEnforcementActions = (): string => {
      if (!enforcementActionCode?.length) {
        return noAction
      }
      const selectedActions = getMappedActions(enforcementActionCode)
      if (!selectedActions) {
        return noAction
      }
      return selectedActions.map(([_key, { description }]) => toSentenceCase(description)).join(', ')
    }

    const contactEnforcementActions = getContactEnforcementActions(contactOutcomes)
    const defaultResponsePeriodDays = contactEnforcementActions?.find(
      action => action.code === enforcementActionCode?.at(-1),
    )?.defaultResponsePeriodDays
    const evidenceDueDate = defaultResponsePeriodDays
      ? DateTime.fromISO(date).plus({ days: defaultResponsePeriodDays }).toFormat('dd MMMM yyyy')
      : null

    const documents = appointment?.documents?.length ? appointment.documents.map(document => document.name) : null

    const outcome = getSelectedOutcome()

    let appointmentDetails = null
    if (appointment?.type && appointment?.startDateTime && appointment?.endDateTime) {
      appointmentDetails = `${appointment.type} on ${dateWithDayAndWithYear(appointment.startDateTime)} at ${govukTime(appointment.startDateTime)} to ${govukTime(appointment.endDateTime)}`
    }

    summary = {
      appointmentDetails,
      outcome,
      notes: notes ?? 'No notes',
      sensitivity,
      nextAppointment,
      documents,
    }

    if (attendedFailedToComply || unacceptableAbsence || failedToAttend || letterType || breachNSICreatedBy) {
      const enforcementAction = getSelectedEnforcementActions()
      summary.enforcementAction = breachNSICreatedBy || letterSentBy ? notePrepend : enforcementAction
      summary.enforcementActionChangeLink = outcomeType ? outcomeRedirectMap(baseOutcomeUrl)[outcomeType] : null
      if (evidenceDueDate) {
        summary.evidenceDueDate = evidenceDueDate
      }
    }
    if (summary) res.locals.appointmentOutcome.summary = summary
  }
  return next()
}
