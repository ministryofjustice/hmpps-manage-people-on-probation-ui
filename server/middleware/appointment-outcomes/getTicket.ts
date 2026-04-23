import { DateTime } from 'luxon'
import { Route } from '../../@types'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { Activity } from '../../data/model/schedule'
import { AppointmentOutcomeProps, AppointmentOutcomeTicket } from '../../models/Locals'

export const getTicket = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const {
      appointmentSession: {
        outcome: { type },
      },
      appointment,
      breach,
      forename,
    } = res.locals.appointmentOutcome as AppointmentOutcomeProps<Activity>

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

    const { crn } = req.params as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const { activities } = await masClient.getPersonActivity(crn)
    const nonCompliantActivities = activities.filter(activity => {
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
    const nonComplianceCount = nonCompliantActivities ? nonCompliantActivities.length : 0
    if (type === 'ATTENDED_FAILED_TO_COMPLY') {
      if (!breach && nonComplianceCount === 1) {
        ticket = {
          title: `This is ${forename}’s second count of non-compliance in the past 12 months`,
          text: [
            '<p>You should consider initiating a breach.</p>',
            `<p>${forename} also failed to comply with:</p>
                  <ul class=""><li></li></ul>`,
          ],
        }
      }
    }
    return next()
  }
}
