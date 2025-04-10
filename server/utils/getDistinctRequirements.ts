import { Activity } from '../data/model/schedule'

export const getDistinctRequirements = (appointments: Activity[]): string[] => {
  const rqmts = appointments.flatMap(entry => (entry.rarCategory ? [entry.rarCategory] : []))
  return rqmts.filter((n, i) => rqmts.indexOf(n) === i)
}
