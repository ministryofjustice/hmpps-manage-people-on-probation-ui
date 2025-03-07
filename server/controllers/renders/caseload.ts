import { HTTPError } from 'superagent'
import { Request, Response, NextFunction } from 'express'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { UserSchedule } from '../../data/model/userSchedule'

const isErrorResponse = <TResponse>(response: HTTPError | TResponse): response is HTTPError => {
  return (response as HTTPError)?.status !== undefined
}

const isUserScheduleResponse = (response: HTTPError | UserSchedule): response is UserSchedule => {
  return (response as UserSchedule)?.appointments !== undefined
}

export const upcomingAppointments = (hmppsAuthClient: HmppsAuthClient) => {
  return async (req: Request, res: Response, _next: NextFunction) => {
    const { page = '0' } = req.query as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    let userSchedule = await masClient.getUserSchedule(res.locals.user.username, page)
    let { appointments } = userSchedule
    appointments = appointments.map(appointment => {
      const [year, month, day] = appointment.dob.split('-')
      return { ...appointment, birthdate: { day, month, year } }
    })
    userSchedule = {
      ...userSchedule,
      appointments,
    }
    return res.render('pages/caseload/upcoming-appointments', { userSchedule, page })
  }
}
