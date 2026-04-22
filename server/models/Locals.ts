import { RiskData } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { Response } from 'express'
import { PersonalDetails } from '../data/model/personalDetails'
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
  AppointmentOutcomeOption,
  ProbationDeliveryUnit,
} from './Appointments'
import { Option } from './Option'
import { Errors } from './Errors'
import { PersonRiskFlags, RiskScore, RiskSummary, RoshRiskWidgetDto, TimelineItem } from '../data/model/risk'
import { TierCalculation } from '../data/tierApiClient'
import { ErrorSummary } from '../data/model/common'
import { Activity, PersonAppointment, PersonSchedule } from '../data/model/schedule'
import { FileCache } from '../@types/FileUpload.type'
import { SentencePlan } from './Risk'
import { ContactResponse } from '../data/model/overdueOutcomes'
import { SmsPreviewResponse } from '../data/model/OutlookEvent'
import { ESupervisionCheckIn, OffenderCheckinsByCRNResponse } from '../data/model/esupervision'

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
  dateOfDeath?: string
  risksWidget?: RoshRiskWidgetDto
  tierCalculation?: TierCalculation | ErrorSummary
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
  uploadError: string
  renderPath: string
  smsPreview?: SmsPreviewResponse | null
  personRisks?: PersonRiskFlags
  riskToStaff?: { id: number; level: RiskScore | null }
  riskToProbationStaff?: { id: number }
  smsConfirmationOptions?: Option[]
  feedbackEmail?: string
  appointmentOutcome?: AppointmentOutcomeProps
}

export interface AppointmentOutcomeProps {
  forename: string
  surname: string
  appointment: AttendedCompliedAppointment | Activity
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
  options?: AppointmentOutcomeOption[]
  sentenceType?: SentenceType
  isProbationPractitioner?: boolean
}

export interface AppResponse extends Response {
  locals: Locals
}
