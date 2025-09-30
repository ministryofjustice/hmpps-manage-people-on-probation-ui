export interface SentencePlan {
  publishedState: string
  uuid: string
  createdDate: string
  createdBy?: User
  lastUpdatedDate: string
  lastUpdatedBy?: User
  currentVersion?: CurrentVersion
  crn?: string
}

interface User {
  externalId: string
  username: string
}

interface AgreementNote {
  optionalNote: string
  agreementStatus: string
  agreementStatusNote: string
  practitionerName: string
  personName: string
  createdDate: string
  createdBy: User
}

interface PlanProgressNote {
  note: string
  isSupportNeeded: string
  isSupportNeededNote: string
  isInvolved: boolean
  isInvolvedNote: string
  personName: string
  practitionerName: string
  createdDate: string
  createdBy: User
}

interface Step {
  uuid: string
  description: string
  status: string
  createdDate: string
  createdBy: User
  actor: string
}

interface Note {
  note: string
  type: string
  createdDate: string
  practitionerName: string
}

interface RelatedAreasOfNeed {
  uuid: string
  name: string
}

interface Goal {
  uuid: string
  title: string
  areaOfNeed: {
    uuid: string
    name: string
  }
  targetDate: string
  reminderDate: string
  createdDate: string
  createdBy: User
  updatedDate: string
  updatedBy: User
  status: string
  statusDate: string
  goalOrder: number
  steps: Step[]
  notes: Note[]
  relatedAreasOfNeed: RelatedAreasOfNeed[]
}

interface CurrentVersion {
  uuid: string
  version: number
  planId: number
  planType: string
  status: string
  agreementStatus: string
  createdDate: string
  createdBy: User
  updatedDate: string
  updatedBy: User
  agreementDate: string
  readOnly: boolean
  checksum: string
  agreementNotes: AgreementNote[]
  planProgressNotes: PlanProgressNote[]
  goals: Goal[]
  softDeleted: boolean
  mostRecentUpdateDate: string
  mostRecentUpdateByName: string
  crn: string
}
