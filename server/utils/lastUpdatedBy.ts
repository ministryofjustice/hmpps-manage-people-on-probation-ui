import { Name } from '../data/model/personalDetails'
import { dateWithYearShortMonth } from './dateWithYearShortMonth'
import { fullName } from './fullName'

export const lastUpdatedBy = (datetime: string, name: Name) => {
  return datetime ? `Last updated by ${fullName(name)} on ${dateWithYearShortMonth(datetime)}` : ''
}
