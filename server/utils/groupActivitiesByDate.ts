import { Activity } from '../data/model/schedule'
import { compactActivityLogDate } from './compactActivityLogDate'

interface Group {
  date: string
  activities: Activity[]
}

export const groupActivitiesByDate = (activities: Activity[]): Group[] => {
  const groups: { date: string; activities: Activity[] }[] = []
  const seenDates = new Set<string>()

  for (const activity of activities) {
    const date = compactActivityLogDate(activity.startDateTime)
    if (date && !seenDates.has(date)) {
      seenDates.add(date)
      groups.push({
        date,
        activities: activities.filter(a => compactActivityLogDate(a.startDateTime) === date),
      })
    }
  }

  return groups
}
