import moment from 'moment'
import { Controller } from '../@types'

const routes = ['getDate'] as const

function generateCalendarData(year: any, month: any) {
  const startOfMonth = moment([year, month])
  const endOfMonth = moment(startOfMonth).endOf('month')
  const startDate = moment(startOfMonth).startOf('week')
  const endDate = moment(endOfMonth).endOf('week')

  const startMinusOneMonth = moment(startOfMonth).subtract(1, 'months').format('MMMM YYYY')
  const startPlusOneMonth = moment(startOfMonth).add(1, 'months').format('MMMM YYYY')

  const date = moment(startDate)
  const calendar = []

  while (date.isBefore(endDate)) {
    const week = []
    for (let i = 0; i < 7; i += 1) {
      week.push({
        day: date.date(),
        month: date.month(),
        year: date.year(),
        isCurrentMonth: date.month() === month,
        iso: date.format('YYYY-MM-DD'),
      })
      date.add(1, 'day')
    }
    calendar.push(week)
  }

  return {
    calendar,
    monthName: startOfMonth.format('MMMM'),
    year,
    month,
    startMinusOneMonth,
    startPlusOneMonth,
  }
}

const dateController: Controller<typeof routes> = {
  getDate: hmppsAuthClient => {
    return async (req, res) => {
      const today = moment()
      const month = Number(req.query.month as string) // 0–11
      const year = Number(req.query.year as string)
      const targetYear = Number.isNaN(year) ? today.year() : year
      const targetMonth = Number.isNaN(month) ? today.month() : month

      const calendarData = generateCalendarData(targetYear, targetMonth)
      res.render('pages/calendar.njk', calendarData)
    }
  },
}

export default dateController
