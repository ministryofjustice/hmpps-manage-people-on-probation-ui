import {
  AppointmentEnforcementAction,
  AppointmentOutcomeType,
  EnforcementActionCreatedBy,
} from '../../../../server/models/Appointments'
import AcceptableAbsencePage from '../../../pages/appointmentOutcomes/acceptable-absence.page'
import AttendedFailedToComplyPage from '../../../pages/appointmentOutcomes/attended-failed-to-comply.page'
import FailedToAttendPage from '../../../pages/appointmentOutcomes/failed-to-attend.page'
import InitiateBreachOrRecallPage from '../../../pages/appointmentOutcomes/initiate-breach-or-recall.page'
import OutcomePage from '../../../pages/appointmentOutcomes/outcome.page'
import SendLetterPage from '../../../pages/appointmentOutcomes/send-letter.page'
import UnacceptableAbsencePage from '../../../pages/appointmentOutcomes/unacceptable-absence.page'
import { uncheckAllRadios } from './uncheckAllRadios'

type ActionPage =
  | typeof AttendedFailedToComplyPage
  | typeof AcceptableAbsencePage
  | typeof UnacceptableAbsencePage
  | typeof FailedToAttendPage

type ValidOutcome = Extract<
  AppointmentOutcomeType,
  | 'ATTENDED_FAILED_TO_COMPLY'
  | 'ATTENDED_SENT_HOME_BEHAVIOUR'
  | 'ATTENDED_SENT_HOME_SERVICE_ISSUES'
  | 'ACCEPTABLE_ABSENCE'
  | 'UNACCEPTABLE_ABSENCE'
  | 'FAILED_TO_ATTEND'
>

type Map = { [K in ValidOutcome]?: ActionPage }

const map: Map = {
  ATTENDED_FAILED_TO_COMPLY: AttendedFailedToComplyPage,
  ATTENDED_SENT_HOME_BEHAVIOUR: AttendedFailedToComplyPage,
  ATTENDED_SENT_HOME_SERVICE_ISSUES: AttendedFailedToComplyPage,
  ACCEPTABLE_ABSENCE: AcceptableAbsencePage,
  UNACCEPTABLE_ABSENCE: UnacceptableAbsencePage,
  FAILED_TO_ATTEND: FailedToAttendPage,
}

const isValidOutcome = (outcome: AppointmentOutcomeType): outcome is ValidOutcome => {
  return Object.hasOwn(map, outcome)
}

export const completeOutcome = ({
  outcome = 'ATTENDED_COMPLIED',
  action = null,
  letterSentBy = 'USER',
}: {
  outcome?: AppointmentOutcomeType
  action?: AppointmentEnforcementAction
  letterSentBy?: EnforcementActionCreatedBy
} = {}) => {
  const outcomePage = new OutcomePage()
  uncheckAllRadios()
  cy.get(`.govuk-radios__input[value=${outcome}]`).click()
  outcomePage.getSubmitBtn().click()
  if (action) {
    completeAction({ outcome, action, letterSentBy })
  }
}

export const completeAction = ({
  outcome = 'ATTENDED_COMPLIED',
  action = null,
  letterSentBy = 'USER',
}: {
  outcome?: AppointmentOutcomeType
  action?: AppointmentEnforcementAction
  letterSentBy?: EnforcementActionCreatedBy
} = {}) => {
  if (action && isValidOutcome(outcome)) {
    let breachPage: InitiateBreachOrRecallPage
    let sendLetterPage: SendLetterPage
    const page = new map[outcome]()
    cy.get(`.govuk-radios__input[value=${action}]`).click()
    page.getSubmitBtn().click()
    const actions: AppointmentEnforcementAction[] = [
      'BREACH_RECALL_INITIATED',
      'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      'SEND_LETTER',
    ]
    const breachActions: AppointmentEnforcementAction[] = [
      'BREACH_RECALL_INITIATED',
      'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
    ]
    const letterActions: AppointmentEnforcementAction[] = ['BREACH_RECALL_INITIATED_AND_SEND_LETTER', 'SEND_LETTER']
    if (actions.includes(action)) {
      if (breachActions.includes(action)) {
        breachPage = new InitiateBreachOrRecallPage()
        cy.get('[data-qa=breachNSICreatedBy]').find(`.govuk-radios__input[value=USER]`).click()
      }
      if (letterActions.includes(action)) {
        const letterValue =
          action === 'BREACH_RECALL_INITIATED_AND_SEND_LETTER'
            ? 'LICENCE_COMPLIANCE_LETTER_SENT'
            : 'FIRST_WARNING_LETTER_SENT'
        cy.get('[data-qa=letterSentBy]').find(`.govuk-radios__input[value=${letterSentBy}]`).click()
        cy.get('[data-qa=letterType]').find(`.govuk-radios__input[value=${letterValue}]`).click()
      }
      if (breachActions.includes(action)) {
        breachPage.getSubmitBtn().click()
      }
      if (action === 'SEND_LETTER') {
        sendLetterPage = new SendLetterPage()
        sendLetterPage.getSubmitBtn().click()
      }
    }
  }
}
