import { RiskData } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { Response } from 'express'
import { Document, PersonalDetails } from '../data/model/personalDetails'
import { FeatureFlags } from '../data/model/featureFlags'
import { Sentence, SentenceType } from '../data/model/sentenceDetails'
import { DefaultUserDetails, Location, Provider, Team, User } from '../data/model/caseload'
import { SentryConfig } from '../config'
import { ActivityLogFiltersResponse } from './ActivityLog'
import {
  AppointmentSession,
  AppointmentType,
  NextAppointmentResponse,
  YesNo,
  AttendedCompliedAppointment,
  AppointmentOutcomeType,
  AppointmentEnforcementAction,
  EnforcementActionLetterType,
  EnforcementActionCreatedBy,
  ProbationDeliveryUnit,
  AcceptableAbsenceOutcomeType,
} from './Appointments'
import { Option } from './Option'
import { Errors } from './Errors'
import { PersonRiskFlags, RiskScore, RiskSummary, RoshRiskWidgetDto, TimelineItem } from '../data/model/risk'
import { TierCalculation, LatestTierResponse } from '../data/tierApiClient'
import { ErrorSummary } from '../data/model/common'
import { Activity, ContactOutcome, PersonAppointment, PersonSchedule } from '../data/model/schedule'
import { Compliance } from '../data/model/overview'
import { BreachOrRecall, SentenceCompliance } from '../data/model/compliance'
import { FileCache } from '../@types/FileUpload.type'
import { SentencePlan } from './Risk'
import { ContactResponse } from '../data/model/overdueOutcomes'
import { SmsPreviewResponse } from '../data/model/OutlookEvent'
import {
  ESupervisionCheckIn,
  EsupervisionUpcomingQuestionsResponse,
  OffenderCheckinsByCRNResponse,
} from '../data/model/esupervision'
import { PersonExistsResponse } from '../data/emdiClient'

export interface AppointmentLocals {
  meta: {
    isVisor: boolean
    forename: string
    change: string
    userIsAttending: boolean
    hasLocation?: boolean
  }
  type?: AppointmentType
  visorReport?: string
  appointmentFor?: {
    sentence: string
    requirement: string
    licenceCondition: string
    nsi: string
    forename: string
    mobileNumber: string
  }
  attending?: {
    name: string
    team: string
    region: string
    html: string
  }
  location?: Location | string
  textMessageConfirmation?: YesNo
  start?: string
  previousStart?: string
  end?: string
  previousEnd?: string
  date?: string
  notes?: string
  sensitivity?: string
  outcomeRecorded?: string
  isReschedule?: boolean
}

export interface LocalsUser {
  userId?: string
  username?: string
  firstName?: string
  surname?: string
  email?: string
  enabled?: boolean
  roles?: string[]
  active?: boolean
  name?: string
  authSource: string
  uuid?: string
  displayName?: string
  token: string
  probationDeliveryUnits?: ProbationDeliveryUnit[]
}

interface Locals {
  errorMessages: Record<string, string>
  warningMessages: Record<string, string>
  filters?: ActivityLogFiltersResponse
  user: LocalsUser
  compactView?: boolean
  defaultView?: boolean
  requirement?: string
  appointment?: AppointmentLocals
  case?: PersonalDetails
  headerPersonName?: { forename: string; surname: string }
  headerCRN?: string
  headerDob?: string
  headerTierLink?: string
  tierUrlV3?: string
  dateOfDeath?: string
  risksWidget?: RoshRiskWidgetDto
  tierCalculation?: TierCalculation | ErrorSummary
  tierDetails?: LatestTierResponse
  predictorScores?: TimelineItem
  riskData?: RiskData
  risks?: RiskSummary
  message?: string
  title?: string
  success?: boolean
  status?: number
  stack?: boolean | number | string
  flags?: FeatureFlags
  sentences?: Sentence[]
  timeOptions?: Option[]
  endTimeOptions?: Option[]
  userLocations?: Location[]
  userProviders?: Provider[]
  userTeams?: Team[]
  userStaff?: User[]
  regionCode?: string
  teamCode?: string
  providerCode?: string
  selectProvider?: Provider[]
  sentry?: SentryConfig
  csrfToken?: string
  cspNonce?: string
  errors?: Errors
  change?: string
  appointmentTypes?: AppointmentType[]
  visor?: boolean
  lastAppointmentDate?: string
  version: string
  backLink: string
  personAppointment?: PersonAppointment
  personSchedule?: PersonSchedule
  appointmentSession?: AppointmentSession
  nextAppointment?: NextAppointmentResponse
  fileErrorStatus?: number
  uploadedFiles?: FileCache[]
  defaultUser?: { username: string; homeArea: string; team: string }
  attendingUser?: DefaultUserDetails
  sentencePlan?: SentencePlan
  alertsCount?: string
  alertsCleared?: { error: boolean; message: string }
  contactResponse?: ContactResponse
  checkIn?: ESupervisionCheckIn
  offenderCheckinsByCRNResponse?: OffenderCheckinsByCRNResponse
  upcomingCheckin?: EsupervisionUpcomingQuestionsResponse
  uploadError: string
  renderPath: string
  smsPreview?: SmsPreviewResponse | null
  personRisks?: PersonRiskFlags
  riskToStaff?: { id: number; level: RiskScore | null }
  riskToProbationStaff?: { id: number }
  smsConfirmationOptions?: Option[]
  feedbackEmail?: string
  appointmentOutcome?: AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>
  action?: string
  personExistsResponse?: PersonExistsResponse
  nextAppointmentLocation?: string
}

export interface AppointmentOutcomeSentence {
  type: SentenceType | null
  length: number | null
  eventId: number | null
  eventNumber?: string | null
  order: string | null
  activeBreach?: BreachOrRecall | null
  activeRecall?: BreachOrRecall | null
  compliance: Compliance | null
  youth: boolean
  pss: boolean | null
}

export type TagColour = 'YELLOW' | 'GREEN' | 'PURPLE' | 'RED' | 'BLUE'

export type WarningType = 'BREACH' | 'RECALL'

export interface AppointmentOutcomeEnforcementAction {
  responseByDate?: string
  responseByDays?: number
}

export interface BreachOrRecallWarning {
  title: string
  text: string
  type: WarningType
}

export interface OutcomeTicket {
  title: string
  html: string
  type?: 'RED' | 'BLUE'
}

export interface OutcomeSummary {
  appointmentDetails: string
  outcome: string
  enforcementAction?: string
  evidenceDueDate?: string
  notes: string
  sensitivity: string
  documents?: string[]
  nextAppointment?: string
  enforcementActionChangeLink?: string
}

export interface OutcomeConfirmationAction {
  text: string
  href: string
  external?: boolean
}

export interface OutcomeConfirmation {
  title: string
  type: string
  date: string
  text: string[]
  actions: OutcomeConfirmationAction[]
}

export interface CurrentOutcome {
  status: string
  reason: string
  tagColour: TagColour
}

export interface CurrentEnforcementAction {
  action: AppointmentEnforcementAction
  code?: string
  description: string
  tagColour: TagColour
  link?: string
  evidenceDueDate?: string
  evidenceWarning?: string
}

export interface OutcomeCompliance {
  currentSentences?: SentenceCompliance[]
}

export interface AppointmentOutcomeProps<TAppointment> {
  forename: string
  surname: string
  appointment: TAppointment
  documents: Document[]
  crn: string
  uuid: string | undefined
  contactId: string | undefined
  id: string
  isInPast: boolean
  isValidParams: boolean
  reqUrl: string
  baseUrl: string
  baseOutcomeUrl: string
  completedUrl: string
  appointmentSession?: AppointmentSession
  backLink?: string
  outcomes?: ContactOutcome[]
  options?:
    | Option<AppointmentOutcomeType>[]
    | Option<AcceptableAbsenceOutcomeType>[]
    | Option<AppointmentEnforcementAction | ''>[]
    | Option<EnforcementActionCreatedBy>[]
  letterSentByOptions?: Option<EnforcementActionCreatedBy>[]
  letterTypeOptions?: Option<EnforcementActionLetterType>[]
  sentence?: AppointmentOutcomeSentence
  isProbationPractitioner?: boolean
  appointmentHintText?: string
  sendBreachOrRecallLetter?: boolean
  sendLetter?: boolean
  currentEnforcementAction?: CurrentEnforcementAction
  currentOutcome?: CurrentOutcome
  breachOrRecallWarning?: BreachOrRecallWarning | null
  ticket?: OutcomeTicket
  notePrepend?: string
  summary?: OutcomeSummary
  confirmation?: OutcomeConfirmation
  compliance?: OutcomeCompliance
  responseContactId?: string
  linkedContactId?: string
}

export interface AppResponse extends Response {
  locals: Locals
}
