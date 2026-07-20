import { DateTime } from 'luxon'
import { type Route } from '../../@types'
import { type AppointmentEnforcementAction } from '../../models/Appointments'
import { enforcementActionMap } from '../../properties/appointment-outcomes'
import { type OutcomeTicket } from '../../models/Locals'
import { dateWithYear } from '../../utils'

export const getFailedToAttendTicket: Route<void> = (req, res, next) => {
  let ticket: OutcomeTicket | null = null
  const {
    forename,
    appointmentSession: {
      date: appointmentDate,
      outcome: { contactOutcomes },
    },
    options,
  } = res.locals.appointmentOutcome
  const enforcementActions =
    contactOutcomes.find(contactOutcome => contactOutcome.code === 'AFTA')?.enforcementActions ?? []
  const actionOptionValues = (options ?? [])
    .filter(option => option?.value)
    .map(option => option.value) as AppointmentEnforcementAction[]

  const actionOptionCodes = Object.entries(enforcementActionMap)
    .filter(([key]) => actionOptionValues.includes(key as AppointmentEnforcementAction))
    .map(([_key, { code }]) => code)

  const filteredActions = enforcementActions.filter(action => actionOptionCodes.includes(action.code))
  const responsePeriodDays =
    filteredActions.length > 0 &&
    filteredActions.every(a => a.defaultResponsePeriodDays === filteredActions[0].defaultResponsePeriodDays)
      ? (filteredActions[0].defaultResponsePeriodDays ?? null)
      : null
  if (responsePeriodDays) {
    const responseByDate = DateTime.fromISO(appointmentDate).plus({ days: responsePeriodDays })
    const daysLeftToRespond = Math.ceil(
      responseByDate.startOf('day').diff(DateTime.now().startOf('day'), 'days').days + 1,
    )
    if (daysLeftToRespond > -1) {
      ticket = {
        title: `${forename} has until ${dateWithYear(responseByDate.toISO())} to submit evidence (${daysLeftToRespond} day${daysLeftToRespond !== 1 ? 's' : ''} remaining)`,
        html: `<p class="govuk-body">This appointment has been marked as failed to attend until evidence is provided. It will be added to the NDelius Enforcement Diary.</p>`,
      }
    }
  }
  res.locals.appointmentOutcome.ticket = ticket
  return next()
}
