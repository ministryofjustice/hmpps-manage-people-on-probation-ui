export interface OffenderSetup {
  uuid: string
  practitionerId: string
  offenderUuid: string
  startedAt: string
  createdAt: string
}

export interface OffenderInfo {
  setupUuid: string
  practitionerId: string
  crn: string
  firstCheckin: string
  checkinInterval: string
  startedAt: string
}
export interface LocationInfo {
  url: string
  contentType: string
  duration: string
}
export interface OffenderSetupCompleteResponse {
  uuid: string
  crn: string
  practitionerId: string
  status: OffenderStatus
  firstCheckin: string
  checkinInterval: string
  createdAt: string
  createdBy: string
  updatedAt: string
  personalDetails?: PersonalDetails
}

export interface Practitioner {
  name: {
    forename: string
    surname: string
  }
  email: string | null
  localAdminUnit: {
    code: string
    description: string
  }
  probationDeliveryUnit: {
    code: string
    description: string
  }
  provider: {
    code: string
    description: string
  }
}

export interface PersonalDetails {
  crn: string
  name: Name
  mobile: string
  email: string | null
  practitioner: Practitioner
}

interface Name {
  forename: string
  surname: string
}

export interface OffenderCheckinsByCRNResponse {
  uuid: string
  crn: string
  status: OffenderStatus
  firstCheckin: string
  checkinInterval: CheckInterval
  contactPreferences: string
}

export type OffenderStatus = 'INITIAL' | 'VERIFIED' | 'INACTIVE'
export type CheckInterval = 'WEEKLY' | 'TWO_WEEKS' | 'FOUR_WEEKS' | 'EIGHT_WEEKS'
