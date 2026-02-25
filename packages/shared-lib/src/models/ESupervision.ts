import { Errors } from './Errors'

export interface ESupervisionSession {
  checkins?: CheckinUserDetails
  manageCheckin?: CheckinUserDetails
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
  settingsUpdated?: boolean
}
