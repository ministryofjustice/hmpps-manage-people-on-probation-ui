import { Response } from 'express'

import { PersonalDetails } from '../data/model/personalDetails'
import { FeatureFlags } from '../data/model/featureFlags'
import { Sentence } from '../data/model/sentenceDetails'
import { Location } from '../data/model/caseload'
import { SentryConfig } from '../config'
import { ActivityLogFiltersResponse } from './ActivityLog'
import { AppointmentType } from './Appointments'
import { Option } from './Option'
import { Errors } from './Errors'

export interface AppointmentLocals {
  meta: {
    isVisor: boolean
    forename: string
    change: string
  }
  type?: AppointmentType
  visorReport?: string
  appointmentFor?: {
    sentence: string
    requirement: string
    licenceCondition: string
    nsi: string
  }
  attending?: {
    name: string
    team: string
    region: string
  }
  location?: {
    buildingName: string
    buildingNumber: string
    streetName: string
    district: string
    town: string
    county: string
    postcode: string
  }
  dateTime?: string[]
  repeating?: string
  notes?: string
  sensitivity?: string
}

interface Locals {
  errorMessages: Record<string, string>
  filters?: ActivityLogFiltersResponse
  user: { token: string; authSource: string; username?: string }
  compactView?: boolean
  defaultView?: boolean
  requirement?: string
  appointment?: AppointmentLocals
  case?: PersonalDetails
  message?: string
  title?: string
  status?: number
  stack?: boolean | number | string
  flags?: FeatureFlags
  sentences?: Sentence[]
  timeOptions?: Option[]
  userLocations?: Location[]
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
}

export interface AppResponse extends Response {
  locals: Locals
}
