import { Route } from '../../@types'
import { Activity } from '../../data/model/schedule'
import { AppointmentSession } from '../../models/Appointments'
import { AppointmentOutcomeProps, OutcomeNextAppointment } from '../../models/Locals'
import { dateWithDayAndWithYear, getDataValue, govukTime, toSentenceCase } from '../../utils'

export const getOutcomeNextAppointment: Route<void> = (req, res, next) => {
  if (res?.locals?.flags?.enableCombinedCYAPage) {
    const { crn } = res.locals.appointmentOutcome as AppointmentOutcomeProps<Activity>
    const { data } = req.session
    const nextAppointmentId = getDataValue<string>(data, ['temp', crn, 'nextAppointmentId']) || null
    const nextAppt = res?.locals?.nextAppointment?.appointment
    let nextAppointment: OutcomeNextAppointment = null
    let type: string
    let startDateTime: string
    let endDateTime: string
    let id: string
    if (nextAppt) {
      ;({ id, type, startDateTime, endDateTime } = nextAppt)
      nextAppointment = {
        id,
        label: `${toSentenceCase(type)} on ${dateWithDayAndWithYear(startDateTime)} at ${govukTime(startDateTime)} to ${govukTime(endDateTime)}`,
      }
    }
    if (nextAppointmentId) {
      const {
        date: nextAppointmentDate,
        start,
        end,
        type: typeCode,
      } = getDataValue<AppointmentSession>(data, ['appointments', crn, nextAppointmentId])
      const nextAppointmentType = res.locals.appointmentTypes.find((t: any) => t.code === typeCode)?.description || null
      nextAppointment = {
        id: nextAppointmentId,
        label: `${toSentenceCase(nextAppointmentType)} on ${dateWithDayAndWithYear(nextAppointmentDate)} at ${govukTime(start)} to ${govukTime(end)}`,
      }
    }

    res.locals.appointmentOutcome.nextAppointment = nextAppointment
  }
  return next()
}
