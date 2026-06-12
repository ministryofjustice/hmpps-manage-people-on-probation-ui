import { appointmentId } from '../appointments/imports/common'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import {
  AcceptableAbsenceOutcomeType,
  AppointmentEnforcementAction,
  AppointmentOutcomeType,
} from '../../../server/models/Appointments'
import {
  completeAction,
  completeAddNotePage,
  completeNextAppointmentPage,
  completeOutcome,
} from '../appointments/utils'
import CheckYourAnswersOutcomePage from '../../pages/appointmentOutcomes/check-your-answers.page'

let manageAppointmentPage: ManageAppointmentPage
let checkYourAnswersOutcomePage: CheckYourAnswersOutcomePage

const crn = 'X000001'

interface Props {
  outcome?: AppointmentOutcomeType | AcceptableAbsenceOutcomeType
  outcomeText?: string
  action?: AppointmentEnforcementAction | AcceptableAbsenceOutcomeType
  actionText?: string
}

const loadPage = ({ outcome = 'ATTENDED_COMPLIED', action = null }: Props = {}): void => {
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
  manageAppointmentPage = new ManageAppointmentPage()
  manageAppointmentPage.getTaskLink(1).click()
  completeOutcome({ outcome, action })
  completeAddNotePage({ journey: 'MANAGE', crnOverride: crn })
  completeNextAppointmentPage()
}

const checkSummary = ({
  outcomeText,
  actionText = null,
  documents = false,
}: { outcomeText?: string; actionText?: string[]; documents?: boolean } = {}) => {
  const appointment = documents
    ? '3 Way Meeting (NS) with Terry Jones on Wednesday 21 February 2024'
    : 'Planned Office Visit (NS) with Terry Jones on Wednesday 21 February 2024'
  checkYourAnswersOutcomePage
    .getSummaryListRow(1)
    .find('.govuk-summary-list__key')
    .should('contain.text', 'Appointment details')
  checkYourAnswersOutcomePage
    .getSummaryListRow(1)
    .find('.govuk-summary-list__value')
    .should('contain.text', `Appointment: ${appointment}`)
  checkYourAnswersOutcomePage
    .getSummaryListRow(2)
    .find('.govuk-summary-list__key')
    .should('contain.text', 'What was the outcome of this appointment?')
  checkYourAnswersOutcomePage
    .getSummaryListRow(2)
    .find('.govuk-summary-list__value')
    .should('contain.text', outcomeText)
  if (actionText) {
    checkYourAnswersOutcomePage
      .getSummaryListRow(3)
      .find('.govuk-summary-list__key')
      .should('contain.text', 'Enforcement action')
    actionText.forEach(text => {
      checkYourAnswersOutcomePage.getSummaryListRow(3).find('.govuk-summary-list__value').should('contain.text', text)
    })
    checkYourAnswersOutcomePage
      .getSummaryListRow(4)
      .find('.govuk-summary-list__key')
      .should('contain.text', 'Evidence due date')
    checkYourAnswersOutcomePage
      .getSummaryListRow(4)
      .find('.govuk-summary-list__value')
      .should('contain.text', '28 February 2024')
  }
  let index = actionText ? 5 : 3
  checkYourAnswersOutcomePage.getSummaryListRow(index).find('.govuk-summary-list__key').should('contain.text', 'Notes')
  checkYourAnswersOutcomePage
    .getSummaryListRow(index)
    .find('.govuk-summary-list__value')
    .should('contain.text', 'Some notes')
  checkYourAnswersOutcomePage
    .getSummaryListRow(index + 1)
    .find('.govuk-summary-list__key')
    .should('contain.text', 'Sensitivity')
  checkYourAnswersOutcomePage
    .getSummaryListRow(index + 1)
    .find('.govuk-summary-list__value')
    .should('contain.text', 'Yes')
  if (documents) {
    checkYourAnswersOutcomePage
      .getSummaryListRow(index + 2)
      .find('.govuk-summary-list__key')
      .should('contain.text', 'Documents')
    checkYourAnswersOutcomePage
      .getSummaryListRow(index + 2)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Document-1.pdf')
    index += 1
  }
  checkYourAnswersOutcomePage
    .getSummaryListRow(index + 2)
    .find('.govuk-summary-list__key')
    .should('contain.text', 'Next appointment')
  checkYourAnswersOutcomePage
    .getSummaryListRow(index + 2)
    .find('.govuk-summary-list__value')
    .should('contain.text', 'Other call on 21 February 2024 at 10:15am to 10:30am')
}

const checkPage = () => {
  describe('Outcome is attended and complied or attended but sent home due to probation service issues', () => {
    const outcomes: Props[] = [
      { outcome: 'ATTENDED_COMPLIED', outcomeText: 'Attended - complied' },
      {
        outcome: 'ATTENDED_SENT_HOME_SERVICE_ISSUES',
        outcomeText: 'Attended - sent home (service issues)',
      },
    ]
    outcomes.forEach(({ outcome, outcomeText, action, actionText }) => {
      it(`should render the page if outcome is ${outcome} ${action ? ` and action is ${action}` : ''}`, () => {
        loadPage({ outcome, action })
        checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
        checkSummary({ outcomeText, actionText: actionText ? [actionText] : null })
      })
    })
  })

  describe('Outcome is attended - failed to comply or failed to attend', () => {
    const outcomes: Props[] = [
      {
        outcome: 'ATTENDED_FAILED_TO_COMPLY',
        outcomeText: 'Attended - failed to comply',
        action: 'NO_FURTHER_ACTION',
        actionText: 'No further action',
      },
      {
        outcome: 'FAILED_TO_ATTEND',
        outcomeText: 'Failed to attend',
        action: 'SEND_LETTER',
        actionText: 'I will send a first warning letter',
      },
    ]
    outcomes.forEach(({ outcome, outcomeText, action, actionText }) => {
      it(`should render the page if outcome is ${outcome} ${action ? ` and action is ${action}` : ''}`, () => {
        loadPage({ outcome, action })
        checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
        checkSummary({ outcomeText, actionText: actionText ? [actionText] : null })
      })
    })
  })
  describe('Outcome is acceptable absence and appointment has a document', () => {
    it('should render the page', () => {
      cy.task('stubAppointment', { documents: true, isFuture: false })
      loadPage({ outcome: 'ACCEPTABLE_ABSENCE', action: 'ACCEPTABLE_ABSENCE_COURT_LEGAL' })
      checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
      checkSummary({ outcomeText: 'Acceptable absence - court / legal', documents: true })
    })
  })

  describe('Outcome is unacceptable absence and action is initiate breach/recall and send a letter', () => {
    it('should render the page', () => {
      cy.task('stubAppointment', { documents: true, isFuture: false })
      loadPage({ outcome: 'UNACCEPTABLE_ABSENCE', action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' })
      checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
      checkSummary({
        outcomeText: 'Unacceptable absence',
        actionText: ['I will initiate the breach', 'I will send a licence compliance letter'],
        documents: true,
      })
    })
  })

  describe('User updates the outcome and enforcement action by clicking the outcome change link', () => {
    it('should render the page with updated outcome and enforcement action', () => {
      cy.task('stubAppointment', { documents: true, isFuture: false })
      loadPage({ outcome: 'UNACCEPTABLE_ABSENCE', action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' })
      checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
      checkYourAnswersOutcomePage.getSummaryListRow(2).find('.govuk-summary-list__actions').find('a').click()
      completeOutcome({ outcome: 'ATTENDED_FAILED_TO_COMPLY', action: 'NO_FURTHER_ACTION' })
      checkYourAnswersOutcomePage
        .getSummaryListRow(2)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'Attended - failed to comply')
      checkYourAnswersOutcomePage
        .getSummaryListRow(3)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'No further action')
    })
  })

  describe('User updates the enforcement action by clicking the enforcement action change link', () => {
    it('should render the page with updated outcome and enforcement action', () => {
      cy.task('stubAppointment', { documents: true, isFuture: false })
      loadPage({ outcome: 'UNACCEPTABLE_ABSENCE', action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' })
      checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
      checkYourAnswersOutcomePage.getSummaryListRow(3).find('.govuk-summary-list__actions').find('a').click()
      completeAction({ outcome: 'UNACCEPTABLE_ABSENCE', action: 'SEND_LETTER' })
      checkYourAnswersOutcomePage
        .getSummaryListRow(2)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'Unacceptable absence')
      checkYourAnswersOutcomePage
        .getSummaryListRow(3)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'I will send a first warning letter')
    })
  })

  describe('User updates the enforcement action by clicking the evidence due date change link', () => {
    it('should render the page with updated outcome and enforcement action', () => {
      cy.task('stubAppointment', { documents: true, isFuture: false })
      loadPage({ outcome: 'UNACCEPTABLE_ABSENCE', action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' })
      checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
      checkYourAnswersOutcomePage.getSummaryListRow(4).find('.govuk-summary-list__actions').find('a').click()
      completeAction({ outcome: 'UNACCEPTABLE_ABSENCE', action: 'REFER_TO_OFFENDER_MANAGER' })
      checkYourAnswersOutcomePage
        .getSummaryListRow(2)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'Unacceptable absence')
      checkYourAnswersOutcomePage
        .getSummaryListRow(3)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'Refer to offender manager')
    })
  })

  describe('User updates the notes by clicking the change link', () => {
    it('should render the page with updated notes', () => {
      const value = 'Some changed notes'
      loadPage({ outcome: 'UNACCEPTABLE_ABSENCE', action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' })
      checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
      checkYourAnswersOutcomePage.getSummaryListRow(5).find('.govuk-summary-list__actions').find('a').click()
      completeAddNotePage({ journey: 'MANAGE', crnOverride: crn, value })
      checkYourAnswersOutcomePage.getSummaryListRow(5).find('.govuk-summary-list__value').should('contain.text', value)
    })
  })
  describe('User updates the sensitivity by clicking the change link', () => {
    it('should render the page with updated sensitivity', () => {
      loadPage({ outcome: 'UNACCEPTABLE_ABSENCE', action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' })
      checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
      checkYourAnswersOutcomePage.getSummaryListRow(6).find('.govuk-summary-list__actions').find('a').click()
      completeAddNotePage({ journey: 'MANAGE', crnOverride: crn, sensitivityIndex: 1 })
      checkYourAnswersOutcomePage.getSummaryListRow(6).find('.govuk-summary-list__value').should('contain.text', 'No')
    })
  })

  describe('User updates the next appointment by clicking the change link', () => {
    it('should render the page with updated next appointment and persist original appointment', () => {
      loadPage({ outcome: 'UNACCEPTABLE_ABSENCE', action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' })
      checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
      checkYourAnswersOutcomePage.getSummaryListRow(7).find('.govuk-summary-list__actions').find('a').click()
      completeNextAppointmentPage({ value: 'KEEP_TYPE' })
      const appointmentType = `Planned Office Visit (NS)`
      checkYourAnswersOutcomePage
        .getSummaryListRow(1)
        .find('.govuk-summary-list__value')
        .should('contain.text', `Appointment: ${appointmentType} with Terry Jones on Wednesday 21 February 2024.`)
      checkYourAnswersOutcomePage
        .getSummaryListRow(7)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'Other call on 21 February 2024 at 10:15am to 10:30am')
    })
  })
}

describe('Check your answers - outcomes', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })

  describe('Manage appointment journey', () => {
    checkPage()
  })
})
