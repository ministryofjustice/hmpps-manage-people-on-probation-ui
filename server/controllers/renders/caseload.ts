import type { Request, Response } from 'express'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import type { UserActivity } from '../../data/model/userSchedule'
import { getSearchParamsString } from '../../utils/utils'

let cols = ['name', 'dob', 'sentence', 'appointment', 'date']

const directions = {
  asc: 'ascending',
  desc: 'descending',
}

type ColName = (typeof cols)[number]
type SortDir = 'asc' | 'desc'

export const userScheduleController = (hmppsAuthClient: HmppsAuthClient) => {
  return async (req: Request, res: Response) => {
    const { query, url } = req
    const type = url.split('/').pop().split('?')[0]
    const { page = '0', sortBy: sortByQuery = '' } = query as Record<string, string>
    const [name, dir] = sortByQuery.split('.') as [ColName, SortDir]
    if (type === 'no-outcome') {
      cols = cols.filter(col => col !== 'appointment')
    }
    const sortBy = cols.reduce((acc, colName) => {
      return { ...acc, [colName]: name === colName ? directions?.[dir] || 'none' : 'none' }
    }, {})
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    let userSchedule = await masClient.getUserSchedule(res.locals.user.username, page, sortByQuery, type)
    const appointments: UserActivity[] = userSchedule.appointments.map((appointment: UserActivity) => {
      const [year, month, day] = appointment.dob.split('-')
      return { ...appointment, birthdate: { day, month, year } }
    })

    const baseUrl = req.url.split('?')[0]
    const sortUrl = `${baseUrl}${getSearchParamsString({ req, ignore: ['sortBy'] })}`
    const paginationUrl = `${baseUrl}${getSearchParamsString({ req, ignore: ['page'], suffix: '&', showPrefixIfNoQuery: true })}`
    userSchedule = {
      ...userSchedule,
      appointments,
    }
    return res.render(`pages/caseload/appointments`, { userSchedule, page, type, sortBy, paginationUrl, sortUrl })
  }
}
