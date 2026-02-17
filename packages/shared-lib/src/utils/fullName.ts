import { Name } from '../data/model/personalDetails'

export const fullName = (name: Name): string => {
  if (name === undefined || name === null) return ''
  return `${name.forename} ${name.surname}`
}
