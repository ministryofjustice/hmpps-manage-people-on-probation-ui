import { Response } from 'express'

import { PersonalDetails } from '../data/model/personalDetails'
import { FeatureFlags } from '../data/model/featureFlags'
import { Sentence } from '../data/model/sentenceDetails'
import { Location, Provider, Team, User } from '../data/model/caseload'
import { SentryConfig } from '../config'
import { ActivityLogFiltersResponse } from './ActivityLog'
import { Appointment, AppointmentTypeOption } from './Appointments'
import { Option } from './Option'
import { Errors } from './Errors'

interface Locals {
  errorMessages: Record<string, string>
  filters?: ActivityLogFiltersResponse
  user: { token: string; authSource: string; username?: string }
  compactView?: boolean
  defaultView?: boolean
  requirement?: string
  appointment?: Appointment
  case?: PersonalDetails
  message?: string
  title?: string
  status?: number
  stack?: boolean | number | string
  flags?: FeatureFlags
  sentences?: Sentence[]
  timeOptions?: Option[]
  userLocations?: Location[]
  userProviders?: Provider[]
  userTeams?: Team[]
  userStaff?: User[]
  sentry?: SentryConfig
  csrfToken?: string
  cspNonce?: string
  errors?: Errors
  change?: string
  appointmentTypes?: AppointmentTypeOption[]
  lastAppointmentDate?: string
  version: string
  backLink: string
}

export interface AppResponse extends Response {
  locals: Locals
}
