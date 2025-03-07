import { Request, Response } from 'express'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'

export const upcomingAppointments = (hmppsAuthClient: HmppsAuthClient) => {
  return async (req: Request, res: Response) => {
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
