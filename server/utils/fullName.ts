import { Name } from '../data/model/personalDetails'

export const fullName = (name: Name): string => {
  return name ? `${name.forename} ${name.surname}` : ''
}
