import { EsupervisionQuestion } from '../data/model/esupervision'
import { Errors } from './Errors'

export interface ESupervisionSession {
  checkins?: CheckinUserDetails
  manageCheckin?: CheckinUserDetails
  restartCheckin?: CheckinUserDetails
  manageQuestions?: ManageQuestionsSession
}

export interface CheckinUserDetails {
  uuid?: string
  date?: string
  dateDt?: Date
  interval?: string
  preferredComs?: string
  checkInMobile?: string
  checkInEmail?: string
  photoUploadOption?: string
  displayCommsOption?: string
  displayDay?: string
  contactUpdated?: boolean
  settingsUpdated?: boolean
  eligibility?: string[]
  eligibilityChoice?: 'replacement-contact' | 'supplementary-contact'
}

export interface ManageQuestionsSession {
  availableQuestions?: EsupervisionQuestion[]
  questionTemplateAndInputs?: Record<string, string>
  draftQuestionInput?: string
}
export interface LocalParams {
  crn: string
  id: string
  errors?: Errors
  body?: Record<string, string | string[]>
  checkInMinDate?: string
  back?: string
  change?: string
  cya?: string
  checkInMobile?: string
  checkInEmail?: string
  contactSaved?: string
  editCheckInMobile?: string
  editCheckInEmail?: string
  questionId?: string
  question?: {
    prefix: string
    suffix: string
  }
}
