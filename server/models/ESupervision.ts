import { Errors } from './Errors'

export interface ESupervisionSession {
  checkins?: CheckinUserDetails
}

export interface CheckinUserDetails {
  uuid?: string
  date?: string
  dateDt?: Date
  interval?: string
  preferredComs?: string
  checkInMobile?: string
  checkInEmail?: string
  photoUploadOption?: string
  displayCommsOption?: string
  displayDay?: string
  contactUpdated?: boolean
}
export interface LocalParams {
  crn: string
  id: string
  errors?: Errors
  body?: Record<string, string | string[]>
  checkInMinDate?: string
  back?: string
  change?: string
  checkInMobile?: string
  checkInEmail?: string
  contactSaved?: string
  editCheckInMobile?: string
  editCheckInEmail?: string
}
