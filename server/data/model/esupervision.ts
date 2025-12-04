export interface ESupervisionOffender {
  uuid: string
  firstName: string
  lastName: string
  crn?: string
  dateOfBirth?: string
  status: 'INITIAL' | 'VERIFIED' | 'ACTIVE'
  practitioner: string
  createdAt: string
  email?: string
  phoneNumber?: string
  photoUrl?: string
  firstCheckin?: string
  checkinInterval: 'WEEKLY' | 'TWO_WEEKS' | 'FOUR_WEEKS' | 'EIGHT_WEEKS'
}

export interface ESupervisionCheckIn {
  uuid: string
  status: 'SUBMITTED' | 'REVIEWED' | 'EXPIRED'
  dueDate: string
  offender: ESupervisionOffender
  submittedAt?: string
  surveyResponse: any
  createdBy: string
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
  checkinStartedAt?: string
  videoUrl?: string
  snapshotUrl?: string
  autoIdCheck?: 'MATCH' | 'NO_MATCH'
  manualIdCheck?: 'MATCH' | 'NO_MATCH'
  flaggedResponses: string[]
}

export interface ESupervisionLog {
  comment: string
  offender: string
  createdAt: string
  uuid: string
  practitioner: string
  logEntryType:
    | 'OFFENDER_SETUP_COMPLETE'
    | 'OFFENDER_DEACTIVATED'
    | 'OFFENDER_CHECKIN_NOT_SUBMITTED'
    | 'OFFENDER_CHECKIN_RESCHEDULED'
    | 'OFFENDER_CHECKIN_OUTSIDE_ACCESS'
  checkin: string
}

export interface ESupervisionCheckInLogs {
  hint: string
  logs: ESupervisionLog[]
}

export interface ESupervisionCheckInResponse {
  checkin: ESupervisionCheckIn
  checkinLogs: ESupervisionCheckInLogs
}

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

export interface ESupervisionReview {
  practitioner: string
  manualIdCheck?: 'MATCH' | 'NO_MATCH'
  missedCheckinComment?: string
}
