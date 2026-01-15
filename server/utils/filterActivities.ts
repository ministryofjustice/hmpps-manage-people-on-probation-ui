import { compactActivityLogDate } from './compactActivityLogDate'
import { Activity } from '../data/model/schedule'

export const filterActivities = (activities: Activity[], date: string) => {
  return activities.filter(activity => compactActivityLogDate(activity.startDateTime) === compactActivityLogDate(date))
}
