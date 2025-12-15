import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { getDataValue, setDataValue, dateTime } from '../utils'
import { Route } from '../@types'
import { CheckAppointment, LocalParams } from '../models/Appointments'
import { isEmptyObject } from '../utils/isEmptyObject'
import { getMinMaxDates } from '../utils/getMinMaxDates'

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

    const { _minDate, _maxDate } = getMinMaxDates()
    const localParams: LocalParams = { crn, id, _minDate, _maxDate }
    const render = `pages/arrange-appointment/location-date-time`
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

    if (checks.overlapsWithMeetingWith) {
      warningMessages.overlapsWithMeetingWith = `${res.locals.case.name.forename} has an existing appointment at ${checks.overlapsWithMeetingWith.startAndEnd} that overlaps with this time. Continue with these details or make changes`
    }

    if (warningMessagesSeen && sameValuesHaveBeenSubmitted === true) {
      return next()
    }

    res.locals.warningMessages = warningMessages
    return res.render(render, { warningMessages, ...localParams })
  }
}
