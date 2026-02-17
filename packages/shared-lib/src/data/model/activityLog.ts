import { PersonSummary } from './personalDetails'
import { Activity } from './schedule'

export interface PersonActivity {
  size: number
  page: number
  totalResults: number
  totalPages: number
  personSummary: PersonSummary
  activities: Activity[]
}
