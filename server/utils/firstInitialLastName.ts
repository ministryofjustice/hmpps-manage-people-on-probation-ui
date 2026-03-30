import { Name } from '../data/model/personalDetails'

export const firstInitialLastName = (name: Name): string => {
  return name ? `${name.forename.charAt(0).toUpperCase()}. ${name.surname}` : ''
}
