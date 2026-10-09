import { DateTime } from 'luxon-business-days'

export class ArrangedSession {
  params: any

  constructor(params: any) {
    this.params = params as Record<string, string>
    this.params.date = this.getDateString(params)
    this.params.startTime = params.startTime ?? '10:00am'
    this.params.endTime = params.endTime ?? '11:00am'
  }

  getDateString(params: any) {
    if (params.date) {
      return params.date
    }
    if (params.year) {
      return DateTime.local(
        Number.parseInt(params.year, 10),
        Number.parseInt(params.month, 10),
        Number.parseInt(params.day, 10),
      ).toISODate()
    }
    return '2021-03-25'
  }
}
