import { DateTime } from 'luxon'
import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { Activity } from '../../data/model/schedule'
import { AppointmentOutcomeProps, AppointmentOutcomeTicket } from '../../models/Locals'
import { dateWithYear } from '../../utils'

export const getTicket = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (_req, res, next) => {
    const { appointmentOutcome } = res.locals
    const {
      appointmentSession: {
        outcome: { type, enforcementAction },
      },
      appointment,
      breach,
      forename,
      crn,
    } = appointmentOutcome as AppointmentOutcomeProps<Activity>

    type EventIdToMatch = 'eventId' | 'eventNumber' | null

    const getIdToMatch = (activity: Activity): EventIdToMatch => {
      let matchEventId: EventIdToMatch = null
      if (activity?.eventId && appointment?.eventId) {
        matchEventId = 'eventId'
      }
      if (!matchEventId && activity?.eventNumber && appointment?.eventNumber) {
        matchEventId = 'eventNumber'
      }
      return matchEventId
    }

    const activityWithinLast12Months = (startDateTime: string) => {
      const now = DateTime.now()
      const monthsDiff = DateTime.fromISO(startDateTime).diff(now, 'months').months
      return (monthsDiff < 0 && monthsDiff >= -12) || monthsDiff >= 0
    }

    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const { activities } = await masClient.getPersonActivity(crn)

    const getActivities = (filter = 'didTheyComply'): Activity[] =>
      activities.filter(activity => {
        const id = getIdToMatch(activity)
        if (id) {
          return (
            activity[id] !== appointment[id] &&
            activity?.didTheyComply === false &&
            activityWithinLast12Months(activity.startDateTime)
          )
        }
        return false
      })

    let ticket: AppointmentOutcomeTicket = null
    if (['UNACCEPTABLE_ABSENCE', 'ATTENDED_FAILED_TO_COMPLY'].includes(type)) {
      const failureToComplyActivities = getActivities()
      const failureToComplyCount = failureToComplyActivities ? failureToComplyActivities.length : 0
      if (!breach && failureToComplyCount === 1) {
        const { id, type: activityType, startDateTime } = failureToComplyActivities[0]
        ticket = {
          title: `This is ${forename}’s second count of non-compliance in the past 12 months`,
          html: `
            <p class="govuk-body">You should consider initiating a breach.</p>
            <p class="govuk-body govuk-!-margin-bottom-2">${forename} also failed to comply with:</p>
                  <ul class="govuk-list govuk-list--bullet">
                  <li><a href="/case/${crn}/appointments/appointment/${id}/manage" target="_blank" rel="noopener noreferrer">${dateWithYear(startDateTime)}: ${activityType} (opens in new tab)</a></li>
                  </ul>`,
        }
      }
      if (!breach && failureToComplyCount > 1) {
        ticket = {
          title: `${forename} has had multiple counts of non-compliance in the past 12 months.`,
          html: `<p class="govuk-body">You should consider initiating a breach. <a href="/case/${crn}/activity-log?&compliance=not%20complied" target="_blank" rel="noopener noreferrer">View a list of ${forename}’s non-compliance (opens in new tab)</a>.</p>`,
        }
      }
      if (breach && failureToComplyCount > 1) {
        ticket = {
          title: `${forename} has had multiple counts of non-compliance in the past 12 months.`,
          html: `<p class="govuk-body govuk-!-margin-bottom-2">${forename} has breached this sentence before. You can:</p>
           <ul class="govuk-list govuk-list--bullet">
           <li><a href="/case/${crn}/activity-log?&compliance=not%20complied" target="_blank" rel="noopener noreferrer">view ${forename}’s failures to comply (opens in a new tab)</a></li>
           <li><a href="/case/${crn}/compliance" target="_blank" rel="noopener noreferrer">view ${forename}’s previous breach information (opens in a new tab)</a></li>
           </ul>
           `,
        }
      }
    }
    if (type === 'ACCEPTABLE_ABSENCE') {
      const acceptableAbsenceActivities = getActivities('acceptableAbsence')
      const acceptableAbsenceCount = acceptableAbsenceActivities ? acceptableAbsenceActivities.length : 0
      if (!breach && acceptableAbsenceCount > 1) {
        ticket = {
          title: `${forename} has had multiple acceptable absences in the past 12 months.`,
          html: `<p class="govuk-body">You can view a <a href="/case/${crn}/activity-log?&keywords=acceptable%20absence" target="_blank" rel="noopener noreferrer">list of ${forename}’s acceptable absences (opens in a new tab)</a>.</p>`,
        }
      }
    }
    if (enforcementAction === 'SEND_LETTER') {
      ticket = {
        title: `${forename} has been sent 2 warning letters in the last 12 months`,
        html: `<p class="govuk-body">First warning letter: sent on Monday 8 December 2025B<br>
            Licence compliance letter: sent on Tuesday 3 January 2026</p>`,
      }
    }
    return next()
  }
}
