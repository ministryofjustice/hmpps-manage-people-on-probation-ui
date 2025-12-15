export interface ESupervisionCheckIn {
  uuid: string
  status: 'SUBMITTED' | 'REVIEWED' | 'EXPIRED'
  dueDate: string
  personalDetails: PersonalDetails
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
  furtherActions?: string
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

export interface ESupervisionReview {
  reviewedBy: string
  manualIdCheck?: 'MATCH' | 'NO_MATCH'
  notes?: string
  missedCheckinComment?: string
  riskManagementFeedback?: boolean
}

export interface ESupervisionNote {
  updatedBy: string
  notes: string
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
  snapshotUrl?: string
}

export type OffenderStatus = 'INITIAL' | 'VERIFIED' | 'INACTIVE'
export type CheckInterval = 'WEEKLY' | 'TWO_WEEKS' | 'FOUR_WEEKS' | 'EIGHT_WEEKS'
