/* eslint-disable import/no-cycle */
import { Response } from 'express'
import { PersonalDetails } from '../data/model/personalDetails'
import { FeatureFlags } from '../data/model/featureFlags'
import { Sentence } from '../data/model/sentenceDetails'
import { Location, Provider, Team, User } from '../data/model/caseload'
import { SentryConfig } from '../config'
import { ActivityLogFiltersResponse } from './ActivityLog'
import { AppointmentSession, AppointmentType, NextComAppointmentResponse } from './Appointments'
import { Option } from './Option'
import { Errors } from './Errors'
import { RoshRiskWidgetDto, TimelineItem } from '../data/model/risk'
import { TierCalculation } from '../data/tierApiClient'
import { ErrorSummary } from '../data/model/common'
import { PersonAppointment } from '../data/model/schedule'
import { FileCache } from '../@types'

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
  }
  attending?: {
    name: string
    team: string
    region: string
  }
  location?: Location | string
  start?: string
  end?: string
  date?: string
  repeating?: string
  repeatingDates?: string[]
  notes?: string
  sensitivity?: string
}

interface Locals {
  errorMessages: Record<string, string>
  warningMessages: Record<string, string>
  filters?: ActivityLogFiltersResponse
  user: { token: string; authSource: string; username?: string }
  compactView?: boolean
  defaultView?: boolean
  requirement?: string
  appointment?: AppointmentLocals
  case?: PersonalDetails
  headerPersonName?: string
  headerCRN?: string
  headerDob?: string
  risksWidget?: RoshRiskWidgetDto
  tierCalculation?: TierCalculation | ErrorSummary
  predictorScores?: TimelineItem
  message?: string
  title?: string
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
  nextAppointmentSession?: AppointmentSession
  nextComAppointment?: NextComAppointmentResponse
  fileErrorStatus?: number
  uploadedFiles?: FileCache[]
}

export interface AppResponse extends Response {
  locals: Locals
}
