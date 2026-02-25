import { Name } from './personalDetails'

export interface UserActivity {
  caseName: Name
  crn: string
  dob: string
  tierScore: string
  latestSentence: string
  numberOfAdditionalSentences: number
  type: string
  startDateTime: string
  endDateTime: string
}

export interface UserSchedule {
  size: number
  page: number
  totalResults: number
  totalPages: number
  name: Name
  appointments: UserActivity[]
}
