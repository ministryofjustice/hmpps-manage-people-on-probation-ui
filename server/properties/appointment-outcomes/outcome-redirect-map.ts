import { AppointmentOutcomeType } from '../../models/Appointments'

export type OutcomeRedirectMap = {
  [K in AppointmentOutcomeType]?: string
}

export const outcomeRedirectMap = (baseOutcomeUrl: string): OutcomeRedirectMap => ({
  ATTENDED_COMPLIED: `${baseOutcomeUrl}/add-note`,
  ATTENDED_FAILED_TO_COMPLY: `${baseOutcomeUrl}/attended-failed-to-comply`,
  ATTENDED_SENT_HOME_BEHAVIOUR: `${baseOutcomeUrl}/attended-failed-to-comply`,
  ATTENDED_SENT_HOME_SERVICE_ISSUES: `${baseOutcomeUrl}/attended-failed-to-comply`,
  ACCEPTABLE_ABSENCE: `${baseOutcomeUrl}/acceptable-absence`,
  UNACCEPTABLE_ABSENCE: `${baseOutcomeUrl}/unacceptable-absence`,
  FAILED_TO_ATTEND: `${baseOutcomeUrl}/failed-to-attend`,
})
