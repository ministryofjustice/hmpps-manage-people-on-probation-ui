import { Activity } from '../data/model/schedule'
import { compactActivityLogDate } from '../utils/compactActivityLogDate'
import { overrideDeliusManagedFlag } from './overrideDeliusManagedFlag'
import { Route } from '../@types'

interface Group {
  date: string
  activities: Activity[]
}

export const groupActivitiesByDate = (activities: Activity[]): Route<Group[]> => {
  return (req, res) => {
    const grouped = new Map<string, Activity[]>()
    for (const activity of activities) {
      const date = compactActivityLogDate(activity.startDateTime)
      // eslint-disable-next-line no-continue
      if (!date) continue
      const list = grouped.get(date)
      if (list) list.push(activity)
      else grouped.set(date, [activity])
    }
    return Array.from(grouped.entries()).map(([date, dateActivities]) => ({
      date,
      activities:
        res.locals?.flags?.enablePreSentence === false
          ? overrideDeliusManagedFlag(dateActivities)(req, res)
          : dateActivities,
    }))
  }
}
