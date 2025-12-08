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
  status: 'INITIAL' | 'VERIFIED' | 'INACTIVE'
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
  name: {
    forename: string
    surname: string
  }
  mobile: string
  email: string | null
  practitioner: Practitioner
}
