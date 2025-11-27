export interface ESupervisionOffender {
  uuid: string
  firstName: string
  lastName: string
  crn?: string
  dateOfBirth?: string
  status: string // INITIAL, VERIFIED, ACTIVE
  practitioner: string
  createdAt: string
  email?: string
  phoneNumber?: string
  photoUrl?: string
  firstCheckin?: string
  checkinInterval: string // WEEKLY, TWO_WEEKS, FOUR_WEEKS, EIGHT_WEEKS
  // deactivationEntry
}

export interface ESupervisionCheckIn {
  uuid: string
  status: string // CREATED, SUBMITED, REVIEWED, CANCELLED, EXPIRED
  dueDate: string
  offender: ESupervisionOffender
  submittedAt?: string
  // surveyResponse
  createdBy: string
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
  checkinStartedAt?: string
  videoUrl?: string
  snapshotUrl?: string
  autoIdCheck?: string // MATCH, NO_MATCH
  manualIdCheck?: string // MATCH, NO_MATCH
  flaggedResponses: string[]
}

export interface ESupervisionLog {
  comment: string
  offender: string
  createdAt: string
  uuid: string
  practitioner: string
  logEntryType: string // OFFENDER_SETUP_COMPLETE, OFFENDER_DEACTIVATED, OFFENDER_CHECKIN_NOT_SUBMITTED, OFFENDER_CHECKIN_RESCHEDULED, OFFENDER_CHECKIN_OUTSIDE_ACCESS
  checkin: string
}

export interface ESupervisionCheckInLogs {
  hint: string
  logs: ESupervisionLog[]
}

export interface ESupervisionCheckInResponse {
  checkIn: ESupervisionCheckIn
  checkInLogs: ESupervisionCheckInLogs
}
