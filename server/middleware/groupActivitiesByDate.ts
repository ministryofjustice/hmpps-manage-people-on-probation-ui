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
    const groups: { date: string; activities: Activity[] }[] = []
    const seenDates = new Set<string>()
    for (const activity of activities) {
      const date = compactActivityLogDate(activity.startDateTime)
      if (date && !seenDates.has(date)) {
        const filteredActivities = activities.filter(a => compactActivityLogDate(a.startDateTime) === date)
        seenDates.add(date)
        groups.push({
          date,
          activities:
            res.locals?.flags?.enablePreSentence === false
              ? overrideDeliusManagedFlag(filteredActivities)(req, res)
              : filteredActivities,
        })
      }
    }
    return groups
  }
}
