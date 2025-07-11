import { DateTime } from 'luxon-business-days'
import { v4 as uuidv4 } from 'uuid'
import { AppointmentSession } from './Appointments'

interface Params {
  appointment: AppointmentSession
  weeksInFuture?: number
  monthsInFuture?: number
}

export class ArrangedSession {
  params: any

  constructor(params: any) {
    this.params = params
    this.params.date = this.getDateString(params)
    this.params.startTime = params.startTime ?? '10:00am'
    this.params.endTime = params.endTime ?? '11:00am'
  }

  getDateString(params: any) {
    if (params.date) {
      return params.date
    }
    if (params.year) {
      return DateTime.local(parseInt(params.year, 10), parseInt(params.month, 10), parseInt(params.day, 10)).toISODate()
    }
    return '2021-03-25'
  }

  static generateRepeatedAppointments(
    appointment: AppointmentSession,
    period: 'week' | 'month' = 'week',
    increment = 1,
  ): AppointmentSession[] {
    const hasRepeatAppointments =
      appointment.repeating === 'Yes' && parseInt(appointment.numberOfRepeatAppointments, 10) > 0
    const numberOfRepeatedAppts = hasRepeatAppointments ? parseInt(appointment.numberOfRepeatAppointments, 10) : 0
    return Array.from(Array(numberOfRepeatedAppts)).map((_, i) => {
      if (period === 'week') {
        return this.generateRepeatWeeklyAppointment({ appointment, weeksInFuture: (i + 1) * increment })
      }
      return this.generateRepeatMonthlyAppointment({ appointment, monthsInFuture: i + increment })
    })
  }

  static generateRepeatMonthlyAppointment(params: Params): AppointmentSession {
    const clonedAppointment: AppointmentSession = { ...params.appointment }
    return {
      ...clonedAppointment,
      uuid: uuidv4(),
      date: DateTime.fromISO(clonedAppointment.date).plus({ months: params.monthsInFuture }).toISODate(),
    }
  }

  static generateRepeatWeeklyAppointment(params: Params): AppointmentSession {
    const clonedAppointment = { ...params.appointment }
    return {
      ...clonedAppointment,
      uuid: uuidv4(),
      date: DateTime.fromISO(clonedAppointment.date).plus({ weeks: params.weeksInFuture }).toISODate(),
    }
  }
}
