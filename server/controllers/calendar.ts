import moment from 'moment'
import { Controller } from '../@types'

const routes = ['getDate'] as const

function generateCalendarData(year: any, month: any) {
  const startOfMonth = moment([year, month])
  const endOfMonth = moment(startOfMonth).endOf('month')
  const startDate = moment(startOfMonth).startOf('week')
  const endDate = moment(endOfMonth).endOf('week')

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
  }
}

const dateController: Controller<typeof routes> = {
  getDate: hmppsAuthClient => {
    return async (req, res) => {
      const today = moment()
      const calendarData = generateCalendarData(today.year(), today.month())
      res.render('pages/calendar.njk', calendarData)
    }
  },
}

export default dateController
