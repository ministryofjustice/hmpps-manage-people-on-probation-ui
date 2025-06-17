import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { getDataValue } from '../utils'
import { Route } from '../@types'
import { CheckAppointment, LocalParams } from '../models/Appointments'
import { isEmptyObject } from '../utils/isEmptyObject'
import { dateTime } from './postAppointments'

export const checkAppointments = (hmppsAuthClient: HmppsAuthClient): Route<Promise<void>> => {
  return async (req, res, next) => {
    const warningMessagesSeen = getUnderscoredFormValue('warningMessagesSeen') === 'true'
    if (warningMessagesSeen) {
      return next()
    }
    function getUnderscoredFormValue(name: string) {
      return req.body[`_${name}`]
    }
    const { crn, id } = req.params
    const { data } = req.session
    const { date, 'start-time': startTime, 'end-time': endTime } = getDataValue(data, ['appointments', crn, id])
    const start = dateTime(date, startTime)
    const end = dateTime(date, endTime)

    const localParams: LocalParams = { crn, id }
    const render = `pages/arrange-appointment/date-time`
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const body: CheckAppointment = { start, end }
    const checks = await masClient.checkAppointments(crn, body)
    const noWarnings = isEmptyObject(checks)
    if (noWarnings) {
      return next()
    }
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
    if (Object.keys(warningMessages).length === 0) {
      return next()
    }
    res.locals.warningMessages = warningMessages
    return res.render(render, { warningMessages, ...localParams })
  }
}
