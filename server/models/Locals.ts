/* eslint-disable import/no-cycle */
import { Response } from 'express'
import { PersonalDetails } from '../data/model/personalDetails'
import { FeatureFlags } from '../data/model/featureFlags'
import { Sentence } from '../data/model/sentenceDetails'
import { DefaultUserDetails, Location, Provider, Team, User } from '../data/model/caseload'
import { SentryConfig } from '../config'
import { ActivityLogFiltersResponse } from './ActivityLog'
import { AppointmentSession, AppointmentType, NextAppointmentResponse, YesNo } from './Appointments'
import { Option } from './Option'
import { Errors } from './Errors'
import { PersonRiskFlags, RiskScore, RoshRiskWidgetDto, TimelineItem } from '../data/model/risk'
import { TierCalculation } from '../data/tierApiClient'
import { ErrorSummary } from '../data/model/common'
import { PersonAppointment, PersonSchedule } from '../data/model/schedule'
import { FileCache } from '../@types'
import { SentencePlan } from './Risk'
import { ContactResponse } from '../data/model/overdueOutcomes'
import { ESupervisionCheckIn, OffenderCheckinsByCRNResponse, SmsPreviewResponse } from '../data/model/esupervision'

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

interface Locals {
  errorMessages: Record<string, string>
  warningMessages: Record<string, string>
  filters?: ActivityLogFiltersResponse
  user: { token: string; authSource: string; username?: string; roles?: string[] }
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
  message?: string
  title?: string
  success?: boolean
  status?: number
  stack?: boolean | number | string | null | undefined
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
  nextAppointmentSession?: AppointmentSession
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
}

export interface AppResponse extends Response {
  locals: Locals
}
