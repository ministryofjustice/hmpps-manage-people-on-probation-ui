import { Spark } from '../data/model/schedule'

export const filterSparks = (sparks: Array<Spark>): Array<Spark> => {
  if (!sparks?.length) {
    return []
  }
  return sparks.toSorted((a, b) => a.description.localeCompare(b.description))
}
