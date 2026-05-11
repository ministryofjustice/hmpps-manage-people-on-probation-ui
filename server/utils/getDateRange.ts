import { DateTime } from 'luxon'

export type RangeType = 'PAST_TWO_YEARS' | 'OLDER_THAN_TWO_YEARS' | 'ALL'

export const getDateRange = (type: RangeType): { fromDate?: string; toDate?: string } => {
  const zone = 'Europe/London'

  const today = DateTime.now().setZone(zone).endOf('day')
  const cutoff = today.minus({ years: 2 }).startOf('day')

  const format = (dt: DateTime) => dt.toFormat('yyyy-MM-dd')

  switch (type) {
    case 'PAST_TWO_YEARS':
      return {
        fromDate: format(cutoff),
        toDate: format(today),
      }

    case 'OLDER_THAN_TWO_YEARS':
      return {
        toDate: format(cutoff.minus({ milliseconds: 1 })),
      }

    case 'ALL':
      return {}

    default: {
      throw new Error(`Unhandled range type: ${type}`)
    }
  }
}
