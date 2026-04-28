import { DateTime } from 'luxon'
import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { Activity } from '../../data/model/schedule'
import { AppointmentOutcomeProps, AppointmentOutcomeTicket } from '../../models/Locals'
import { dateWithYear } from '../../utils'
import { ActivityCount } from '../../data/model/overview'

export const getTicket = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (_req, res, next) => {
    const { appointmentOutcome } = res.locals
    const {
      appointmentSession: {
        outcome: { type, enforcementAction },
      },
      appointment,
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

    const activityIsWithinLast12Months = (startDateTime: string) => {
      const now = DateTime.now()
      const monthsDiff = DateTime.fromISO(startDateTime).diff(now, 'months').months
      return (monthsDiff < 0 && monthsDiff >= -12) || monthsDiff >= 0
    }

    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)

    const [personActivity, personCompliance] = await Promise.all([
      masClient.getPersonActivity(crn),
      masClient.getPersonCompliance(crn),
    ])

    const personActivityInLast12Months = personActivity.activities.filter(activity => {
      const id = getIdToMatch(activity)
      return activity[id] !== appointment[id] && activityIsWithinLast12Months(activity.startDateTime)
    })

    const getActivities = ({
      activityCountType = 'attendedButDidNotComplyCount',
      previousBreach = false,
    }: {
      activityCountType?: keyof ActivityCount
      previousBreach?: boolean
    } = {}): Activity[] => {
      const activities = personActivityInLast12Months.filter(activity => {
        return personCompliance.currentSentences.some(currentSentence => {
          let previousBreachMatches = true
          if (activityCountType === 'attendedButDidNotComplyCount') {
            previousBreachMatches = previousBreach
              ? currentSentence.order.breaches > 0
              : currentSentence.order.breaches === 0
          }
          return (
            currentSentence.eventNumber === activity.eventNumber &&
            currentSentence.activity[activityCountType] > 0 &&
            previousBreachMatches
          )
        })
      })
      return activities
    }

    const getPreviousWarningLetters = () => {
      const letters = personCompliance.currentSentences.filter(currentSentence => {
        return (
          personActivityInLast12Months.some(activity => activity.eventNumber === currentSentence.eventNumber) &&
          currentSentence.activity.lettersCount > 0
        )
      })
      //  .map(item => )
    }

    let ticket: AppointmentOutcomeTicket = null
    if (['UNACCEPTABLE_ABSENCE', 'ATTENDED_FAILED_TO_COMPLY'].includes(type)) {
      const activitiesWithNoPreviousBreach = getActivities()
      const activitiesWithPreviousBreach = getActivities({ previousBreach: true })
      if (activitiesWithNoPreviousBreach.length === 1) {
        const { id, type: activityType, startDateTime } = activitiesWithNoPreviousBreach[0]
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
      if (activitiesWithNoPreviousBreach.length > 1) {
        ticket = {
          title: `${forename} has had multiple counts of non-compliance in the past 12 months.`,
          html: `<p class="govuk-body">You should consider initiating a breach. <a href="/case/${crn}/activity-log?&compliance=not%20complied" target="_blank" rel="noopener noreferrer">View a list of ${forename}’s non-compliance (opens in new tab)</a>.</p>`,
        }
      }
      if (activitiesWithPreviousBreach.length > 1) {
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
      const activities = getActivities({ activityCountType: 'acceptableAbsenceCount' })
      if (activities.length > 1) {
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
    res.locals.appointmentOutcome.ticket = ticket
    return next()
  }
}
