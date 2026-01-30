export interface SentencePlan {
  publishedState: string
  uuid: string
  createdDate: string
  createdBy?: User
  lastUpdatedDate: string
  lastUpdatedBy?: User
  currentVersion?: CurrentVersion
  versions: Version[]
  crn?: string
}

interface User {
  externalId: string
  username: string
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

type PlanType = 'INITIAL' | 'REVIEW' | 'TERMINATE' | 'TRANSFER' | 'OTHER'

interface CreatedBy {
  externalId: string
  username: string
}
interface Version {
  uuid: string
  version: number
  planId: number
  planType: PlanType
  status: Status
  agreementStatus: AgreementStatus
  createdDate: string
  createdBy?: CreatedBy
  updatedDate: string
  updatedBy?: string
  agreementDate: string
  readOnly: boolean
  checksum: string
  agreementNotes: AgreementNote[]
  planProgressNotes: PlanProgressNote[]
  goals: Goal[]
  softDeleted: boolean
  mostRecentUpdateDate: string
  mostRecentUpdateByName?: string
  crn?: string
}

interface Note {
  practitionerName: string
  personName: string
  createdDate: string
  createdBy: CreatedBy
}

type NoteType = 'PROGRESS' | 'REMOVED' | 'ACHIEVED' | 'READDED'

interface AgreementNote extends Note {
  optionalNote: string
  agreementStatus: AgreementStatus
  agreementStatusNote: string
}

type SupportNeededOptions = 'YES' | 'NO' | 'DONT_KNOW'

interface PlanProgressNote extends Note {
  note: string
  isSupportNeeded: SupportNeededOptions
  isSupportNeededNote: string
  isInvolved: boolean
  isInvolvedNote: string
}

interface Step {
  uuid: string
  description: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANNOT_BE_DONE_YET' | 'NO_LONGER_NEEDED'
  createdDate: string
  createdBy?: CreatedBy
  actor: string
}

interface AreaOfNeed {
  uuid: string
  name: string
}

type AgreementStatus =
  | 'DRAFT'
  | 'AGREED'
  | 'DO_NOT_AGREE'
  | 'COULD_NOT_ANSWER'
  | 'UPDATED_AGREED'
  | 'UPDATED_DO_NOT_AGREE'

type Status =
  | 'AWAITING_COUNTERSIGN'
  | 'AWAITING_DOUBLE_COUNTERSIGN'
  | 'COUNTERSIGNED'
  | 'DOUBLE_COUNTERSIGNED'
  | 'LOCKED_INCOMPLETE'
  | 'REJECTED'
  | 'ROLLED_BACK'
  | 'SELF_SIGNED'
  | 'UNSIGNED'

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
