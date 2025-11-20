import { Errors } from './Errors'

export interface ESupervisionSession {
  checkin?: CheckinUserDetails
}

export interface CheckinUserDetails {
  uuid: string
  firstCheckin: string
  checkinInterval: string
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
}
