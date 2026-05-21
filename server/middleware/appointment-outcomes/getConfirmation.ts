import { Route } from '../../@types'
import { Activity } from '../../data/model/schedule'
import { AppointmentEnforcementAction, AppointmentOutcomeType } from '../../models/Appointments'
import { dateWithYear, dayOfWeek } from '../../utils'
import { to12HourTimeCompact } from '../../utils/to12HourTimeCompact'
import { enforcementActionMap } from '../../properties/appointment-outcomes'
import type { OutcomeConfirmationAction, OutcomeConfirmation, AppointmentOutcomeProps } from '../../models/Locals'

export const getConfirmation: Route<void> = (req, res, next): void => {
  const appointmentOutcome = res.locals.appointmentOutcome as AppointmentOutcomeProps<Activity>
  const { contactResponse } = res.locals
  const {
    crn,
    id,
    appointmentSession,
    appointment,
    sentence: { type: sentenceType },
  } = appointmentOutcome

  let title = 'Enforcement outcome added'
  const actions: OutcomeConfirmationAction[] = []
  let hasActions = true
  const noDiaryActionText = 'This outcome has been saved against the appointment on NDelius.'
  const diaryActionText = 'This enforcement outcome has been added to the NDelius Enforcement Diary.'
  let text = [diaryActionText]
  const { date, start, end } = appointmentSession
  const type = appointment?.type || null
  const appointmentDate = `${dayOfWeek(date)} ${dateWithYear(date)} from ${to12HourTimeCompact(start)} to ${to12HourTimeCompact(end)}`

  // Attended and complied, Attended but sent home due to service issues, Acceptable absence 👇

  const attendedFailedToComply = appointmentSession?.outcome?.attendedFailedToComply || null
  const acceptableAbsence = appointmentSession?.outcome?.acceptableAbsence || null
  const unacceptableAbsence = appointmentSession?.outcome?.unacceptableAbsence || null
  const failedToAttend = appointmentSession?.outcome?.failedToAttend || null
  const otherEnforcementAction = appointmentSession?.outcome?.otherEnforcementAction || null
  const updateEnforcementAction = appointmentSession?.outcome?.updateEnforcementAction || null

  const allSelectedActions = [
    attendedFailedToComply,
    acceptableAbsence,
    unacceptableAbsence,
    failedToAttend,
    otherEnforcementAction,
    updateEnforcementAction,
  ].filter(action => action) as AppointmentEnforcementAction[]

  const outcomes: AppointmentOutcomeType[] = [
    'ATTENDED_COMPLIED',
    'ATTENDED_SENT_HOME_SERVICE_ISSUES',
    'ACCEPTABLE_ABSENCE',
  ]
  if (outcomes.includes(appointmentSession.outcome.outcomeType)) {
    title = 'Appointment outcome updated'
    text = [noDiaryActionText]
  }

  if (appointmentSession?.outcome?.letterType && appointmentSession?.outcome?.letterSentBy) {
    const letterType = enforcementActionMap[appointmentSession.outcome.letterType].description
      .toLowerCase()
      .replace(' sent', '')
    // Enforcement letter sent by case admin 👇
    if (appointmentSession?.outcome?.letterSentBy === 'CASE_ADMIN') {
      if (sentenceType === 'CUSTODY') {
        actions.push({
          text: 'use the Consider a recall service',
          href: 'https://sign-in.hmpps.service.justice.gov.uk/auth/sign-in?redirect_uri=https://consider-a-recall.hmpps.service.justice.gov.uk/sign-in/callback',
          external: true,
        })
      }
      text = [diaryActionText, `Follow your local process to request a ${letterType}.`]
    }
    // Enforcement letter sent by PP 👇
    if (appointmentSession?.outcome?.letterSentBy === 'USER') {
      hasActions = false
      text = [diaryActionText, `Your case administrator or you will create and send a ${letterType}.`]
    }
  }

  // Enforcement other than letter 👇

  const noLetterOutcomes: AppointmentOutcomeType[] = [
    'ATTENDED_COMPLIED',
    'ATTENDED_SENT_HOME_SERVICE_ISSUES',
    'ACCEPTABLE_ABSENCE',
    'UNACCEPTABLE_ABSENCE',
  ]

  const noDiaryActions: AppointmentEnforcementAction[] = [
    'BREACH_RECALL_INITIATED',
    'BREACH_CONFIRMATION_SENT',
    'BREACH_LETTER_SENT',
    'BREACH_REQUEST_ACTIONED',
    'RECALL_REQUESTED',
    'LICENCE_COMPLIANCE_LETTER_SENT',
    'NO_FURTHER_ACTION',
    'OTHER_ENFORCEMENT_LETTER_SENT',
    'SECOND_WARNING_LETTER_SENT',
    'WITHDRAWAL_OF_WARNING',
    'YOT_OM_NOTIFIED',
  ]

  if (
    !noLetterOutcomes.includes(appointmentSession.outcome.outcomeType) &&
    !allSelectedActions.includes('NO_FURTHER_ACTION') &&
    !appointmentSession.outcome.letterSentBy &&
    noDiaryActions.some(action => allSelectedActions.includes(action))
  ) {
    text = [noDiaryActionText]
    if (appointmentSession?.outcome?.breachNSICreatedBy) {
      text.push('Liase with your case administrator to create a breach/recall NSI on NDelius.')
    }
  }

  // Unacceptable absence 👇

  if (
    !appointmentSession?.outcome?.letterSentBy &&
    appointmentSession.outcome.outcomeType === 'UNACCEPTABLE_ABSENCE' &&
    // !outcomes.includes(appointmentSession.outcome.outcomeType) &&
    !allSelectedActions.includes('NO_FURTHER_ACTION')
  ) {
    console.log('unacceptable absence')

    title = 'Unacceptable absence outcome added'
    text = noDiaryActions.some(action => allSelectedActions.includes(action)) ? [noDiaryActionText] : [diaryActionText]
  }

  // No further action 👇

  if (allSelectedActions.includes('NO_FURTHER_ACTION')) {
    title = 'No further action outcome added'
    text = [noDiaryActionText]
  }

  // Further actions 👇

  if (hasActions) {
    actions.push({
      text: 'arrange another appointment',
      href: `/case/${crn}/appointments/appointment/${id}/next-appointment?back=${encodeURIComponent(req.url)}`,
    })
    if (contactResponse.content.length) {
      if (contactResponse.content.length === 1) {
        actions.push({
          text: `log appointment outcome for ${dayOfWeek(contactResponse.content[0].date)} ${dateWithYear(contactResponse.content[0].date)}`,
          href: `/case/${crn}/appointments/appointment/${contactResponse.content[0].id}/manage`,
        })
      } else {
        actions.push({
          text: `log outcomes for ${contactResponse.content.length} appointments`,
          href: `/case/${crn}/record-an-outcome/outcome`,
        })
      }
    }
  }
  const confirmation: OutcomeConfirmation = {
    title,
    type,
    date: appointmentDate,
    text,
    actions,
  }
  console.log(confirmation)
  res.locals.appointmentOutcome.confirmation = confirmation
  return next()
}
