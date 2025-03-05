/* eslint-disable import/no-cycle */
import { Request, Response, NextFunction } from 'express'
import { ActivityLogFiltersResponse, Appointment, AppointmentTypeOption, Errors, Option } from './index'
import { PersonalDetails } from '../data/model/personalDetails'
import { FeatureFlags } from '../data/model/featureFlags'
import { Sentence } from '../data/model/sentenceDetails'
import { Location } from '../data/model/caseload'
import { SentryConfig } from '../config'

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
  appointmentTypes?: AppointmentTypeOption[]
  lastAppointmentDate?: string
  version: string
  backLink: string
}

export interface AppResponse extends Response {
  locals: Locals
}

export type Route<T> = (req: Request, res: AppResponse, next?: NextFunction) => T
