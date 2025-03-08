import type { Request, Response } from 'express'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import type { UserActivity } from '../../data/model/userSchedule'

export const userScheduleController = (hmppsAuthClient: HmppsAuthClient) => {
  return async (req: Request, res: Response) => {
    const type = req.url.split('/').pop().split('?')[0]
    const { page = '0' } = req.query as Record<string, string>
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    let userSchedule = await masClient.getUserSchedule(res.locals.user.username, page, type)
    const appointments: UserActivity[] = userSchedule.appointments.map((appointment: UserActivity) => {
      const [year, month, day] = appointment.dob.split('-')
      return { ...appointment, birthdate: { day, month, year } }
    })
    userSchedule = {
      ...userSchedule,
      appointments,
    }
    return res.render(`pages/caseload/appointments`, { userSchedule, page, type })
  }
}
