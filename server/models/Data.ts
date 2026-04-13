import { RiskData } from '@ministryofjustice/hmpps-arns-frontend-components-lib'
import { Location, Provider, Team, User } from '../data/model/caseload'
import { PersonalDetails } from '../data/model/personalDetails'
import { PersonRiskFlags, RiskScoresDto, RiskSummary } from '../data/model/risk'
import { Sentence } from '../data/model/sentenceDetails'
import { TierCalculation } from '../data/tierApiClient'
import { AppointmentSession, AppointmentType } from './Appointments'
import { Errors } from './Errors'
import { ESupervisionSession } from './ESupervision'
import { SentencePlan } from './Risk'
import { ErrorSummary } from '../data/model/common'
import { ProbationPractitioner } from './CaseDetail'

export interface PersonalDetailsSession {
  overview: PersonalDetails
  sentencePlan: SentencePlan
  risks: RiskSummary
  tierCalculation: TierCalculation
  riskData?: RiskData
  predictors?: RiskScoresDto[] | ErrorSummary
  probationPractitioner?: ProbationPractitioner
}

export interface Data {
  isOutLookEventFailed?: any
  appointments?: {
    [crn: string]: {
      [id: string]: AppointmentSession
    }
  }
  sentences?: {
    [crn: string]: Sentence[]
  }
  appointmentTypes?: AppointmentType[]
  personalDetails?: {
    [crn: string]: PersonalDetailsSession
  }
  errors?: Errors
  locations?: {
    [userId: string]: Location[]
  }
  region?: string
  team?: string
  providers?: {
    [userId: string]: Provider[]
  }
  teams?: {
    [userId: string]: Team[]
  }
  staff?: {
    [userId: string]: User[]
  }
  esupervision?: {
    [crn: string]: {
      [id: string]: ESupervisionSession
    }
  }
  risks?: {
    [crn: string]: PersonRiskFlags
  }
}
