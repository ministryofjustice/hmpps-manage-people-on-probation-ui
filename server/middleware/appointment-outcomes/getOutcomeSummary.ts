import { DateTime } from 'luxon'
import { Route } from '../../@types'
import { AppointmentEnforcementAction, AppointmentOutcomeType } from '../../models/Appointments'
import { Option } from '../../models/Option'
import { dateWithYear, govukTime } from '../../utils'
import { outcomeRedirectMap } from '../../properties/appointment-outcomes/outcome-redirect-map'
import {
  outcomeOptions,
  attendedFailedToComplyOptions,
  acceptableAbsenceOptions,
  failedToAttendOptions,
  enforcementActionOptions,
  outcomeMap,
  enforcementActionMap,
  letterTypeOptions,
} from '../../properties/appointment-outcomes'
import { Activity } from '../../data/model/schedule'
import { AppointmentOutcomeProps, OutcomeSummary } from '../../models/Locals'

let summary: OutcomeSummary

export const getOutcomeSummary: Route<void> = (_req, res, next) => {
  if (res?.locals?.appointmentOutcome?.appointmentSession?.outcome) {
    const {
      sentence: { type: sentenceType },
      forename,
      notePrepend,
      appointmentHintText,
      baseOutcomeUrl,
      appointmentSession: {
        notes,
        sensitivity,
        date,
        outcome: {
          outcomeType,
          outcomeCode,
          enforcementActionCode,
          contactEnforcementActions,
          attendedFailedToComply,
          acceptableAbsence,
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
      nextAppointment = `${type} on ${dateWithYear(startDateTime)} at ${govukTime(startDateTime)} to ${govukTime(endDateTime)}`
    }
    const allEnforcementActionOptions: Option<AppointmentEnforcementAction | ''>[] = [
      ...attendedFailedToComplyOptions(sentenceType),
      ...acceptableAbsenceOptions,
      ...failedToAttendOptions(forename),
      ...enforcementActionOptions(forename),
      ...letterTypeOptions,
    ]

    const noOutcome = 'No outcome'
    const noAction = 'No enforcement action'

    const getSelectedOutcome = (): string => {
      if (!outcomeCode) return noOutcome
      const selected = Object.entries(outcomeMap).find(
        ([_key, { code }]) => outcomeCode === code,
      )[0] as AppointmentOutcomeType
      if (!selected) return noOutcome
      return outcomeOptions.find(option => option.value === selected)?.text || noOutcome
    }

    const getSelectedEnforcementAction = (): string => {
      if (!enforcementActionCode?.length) {
        return noAction
      }
      const selected = Object.entries(enforcementActionMap).find(
        ([_key, { code }]) => enforcementActionCode?.at(-1) === code,
      )[0] as AppointmentOutcomeType
      if (!selected) {
        return noAction
      }
      return allEnforcementActionOptions.find(option => option?.value && selected === option.value)?.text || noAction
    }

    const defaultResponsePeriodDays = contactEnforcementActions?.find(
      action => action.code === enforcementActionCode?.at(-1),
    )?.defaultResponsePeriodDays
    const evidenceDueDate = defaultResponsePeriodDays
      ? DateTime.fromISO(date).plus({ days: defaultResponsePeriodDays }).toFormat('dd MMMM yyyy')
      : null

    const documents = appointment?.documents?.length
      ? appointment.documents.map(document => document.name).join('<br>')
      : null

    const enforcementAction = getSelectedEnforcementAction()
    const outcome = `${getSelectedOutcome()}${acceptableAbsence ? ` - ${enforcementAction.toLowerCase()}` : ''}`

    summary = {
      appointmentDetails: appointmentHintText,
      outcome,
      notes: notes ?? 'No notes',
      sensitivity,
      nextAppointment,
      documents,
    }

    if (attendedFailedToComply || unacceptableAbsence || failedToAttend || letterType) {
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
