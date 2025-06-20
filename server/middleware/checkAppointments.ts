import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { getDataValue, setDataValue, dateTime } from '../utils'
import { Route } from '../@types'
import { CheckAppointment, LocalParams } from '../models/Appointments'
import { isEmptyObject } from '../utils/isEmptyObject'

export const checkAppointments = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const warningMessagesSeen = getUnderscoredFormValue('warningMessagesSeen') === 'true'
    function getUnderscoredFormValue(name: string) {
      return req.body[`_${name}`]
    }
    const { crn, id } = req.params
    const { data } = req.session
    const { date, start: startTime, end: endTime, previousValues } = getDataValue(data, ['appointments', crn, id])
    const sameValuesHaveBeenSubmitted = JSON.stringify({ date, startTime, endTime }) === JSON.stringify(previousValues)
    setDataValue(data, ['appointments', crn, id, 'previousValues'], { date, startTime, endTime })
    const start = dateTime(date, startTime)
    const end = dateTime(date, endTime)

    const localParams: LocalParams = { crn, id }
    const render = `pages/arrange-appointment/date-time`
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const body: CheckAppointment = { start, end }
    const checks = await masClient.checkAppointments(crn, body)
    const noErrorsOrWarnings = isEmptyObject(checks)
    if (noErrorsOrWarnings) {
      return next()
    }
    // Check warnings
    const warningMessages: Record<string, string> = {}
    if (checks.nonWorkingDayName) {
      warningMessages.nonWorkingDayName = `You have selected a non-working day (${checks.nonWorkingDayName}). Continue with these details or make changes.`
    }
    if (checks.isWithinOneHourOfMeetingWith) {
      warningMessages.isWithinOneHourOfMeetingWith =
        checks.isWithinOneHourOfMeetingWith.isCurrentUser === true
          ? `You already have an appointment with ${res.locals.case.name.forename} within an hour of this date and time. Continue with these details or make changes.`
          : `${checks.isWithinOneHourOfMeetingWith.appointmentIsWith.forename} ${checks.isWithinOneHourOfMeetingWith.appointmentIsWith.surname} already has an appointment with ${res.locals.case.name.forename} within an hour of this date and time. Continue with these details or make changes.`
    }

    // Check errors
    const errorMessages: Record<string, string> = {}
    if (checks.overlapsWithMeetingWith) {
      errorMessages[`appointments-${crn}-${id}-start`] =
        `Choose a time that does not clash with ${res.locals.case.name.forename}’s existing appointment at ${checks.overlapsWithMeetingWith.startAndEnd}`
    }

    if (warningMessagesSeen && Object.keys(errorMessages).length === 0 && sameValuesHaveBeenSubmitted === true) {
      return next()
    }

    res.locals.warningMessages = warningMessages
    res.locals.errorMessages = errorMessages
    return res.render(render, { warningMessages, ...localParams })
  }
}
