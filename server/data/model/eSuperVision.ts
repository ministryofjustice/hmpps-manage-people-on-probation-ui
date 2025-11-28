export type ExternalUserId = string
export interface OffenderSetup {
  uuid: string

  practitioner: ExternalUserId

  offender: string

  createdAt: string
}

export interface OffenderInfo {
  setupUuid: string

  practitionerId: ExternalUserId

  firstName: string

  lastName: string

  crn: string

  dateOfBirth: string

  email: string

  phoneNumber: string

  firstCheckinDate: string

  checkinInterval: string

  startedAt: string
}
export interface LocationInfo {
  url: string

  contentType: string

  duration: string
}
