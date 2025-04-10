import { dateWithYearShortMonth } from './dateWithYearShortMonth'

export const lastUpdatedDate = (datetime: string) => {
  return datetime ? `Last updated ${dateWithYearShortMonth(datetime)}` : ''
}
