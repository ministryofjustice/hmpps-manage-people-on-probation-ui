import { DateTime } from 'luxon'

export type RangeType = 'PAST_THREE_MONTHS' | 'OLDER_THAN_THREE_MONTHS' | 'ALL'

export const getDateRange = (type: RangeType): { fromDate?: string; toDate?: string } => {
  const zone = 'Europe/London'

  const today = DateTime.now().setZone(zone).endOf('day')
  const cutoff = today.minus({ months: 3 }).startOf('day')

  const format = (dt: DateTime) => dt.toFormat('yyyy-MM-dd')

  switch (type) {
    case 'PAST_THREE_MONTHS':
      return {
        fromDate: format(cutoff),
        toDate: format(today),
      }

    case 'OLDER_THAN_THREE_MONTHS':
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
