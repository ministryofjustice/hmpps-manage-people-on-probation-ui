import { DateTime } from 'luxon'
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

const yesterday = DateTime.now().minus({ days: 1 }).toFormat('cccc d LLLL yyyy')

interface Props {
  outcome?: AppointmentOutcomeType | AcceptableAbsenceOutcomeType
  outcomeText?: string
  action?: AppointmentEnforcementAction | AcceptableAbsenceOutcomeType
  actionText?: string
  notes?: string
}

const loadPage = ({ outcome = 'ATTENDED_COMPLIED', action = null, notes = 'Some notes' }: Props = {}): void => {
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
  manageAppointmentPage = new ManageAppointmentPage()
  manageAppointmentPage.getTaskLink(1).click()
  completeOutcome({ outcome, action })
  completeAddNotePage({ journey: 'MANAGE', crnOverride: crn, value: notes })
  completeNextAppointmentPage()
}

const checkSummary = ({
  outcomeText,
  actionText = null,
  documents = false,
}: { outcomeText?: string; actionText?: string[]; documents?: boolean } = {}) => {
  const appointment = documents
    ? `3 way meeting (NS) on Wednesday 21 February 2024 at 10:15am to 10:30am`
    : 'Planned office visit (NS) on Wednesday 21 February 2024 at 10:15am to 10:30am'
  checkYourAnswersOutcomePage
    .getSummaryListRow(1)
    .find('.govuk-summary-list__key')
    .should('contain.text', 'Appointment details')
  checkYourAnswersOutcomePage
    .getSummaryListRow(1)
    .find('.govuk-summary-list__value')
    .should('contain.text', appointment)
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
    .should('contain.text', 'Other call on Wednesday 21 February 2024 at 10:15am to 10:30am')
  checkYourAnswersOutcomePage.getSubmitBtn().should('contain.text', 'Confirm this appointment')
}

const checkPage = () => {
  describe('Outcome is unacceptable absence and action is initiate breach/recall and send a letter', () => {
    it('should render the page', () => {
      cy.task('stubAppointment', { documents: true, isFuture: false })
      loadPage({ outcome: 'UNACCEPTABLE_ABSENCE', action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' })
      checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
      checkSummary({
        outcomeText: 'Unacceptable absence',
        actionText: ['I will initiate the breach', 'I will send a different enforcement letter'],
        documents: true,
      })
    })
  })

  describe('User changes answers using the change links', () => {
    it('should update notes, sensitivity, enforcement action, outcome and next appointment', () => {
      const notes = 'Some changed notes'
      const appointmentType = 'Planned office visit (NS)'
      const clickChange = (rowKey: string) =>
        cy.contains('.govuk-summary-list__row', rowKey).find('.govuk-summary-list__actions a').click()
      const rowValue = (rowKey: string) =>
        cy.contains('.govuk-summary-list__row', rowKey).find('.govuk-summary-list__value')

      loadPage({ outcome: 'UNACCEPTABLE_ABSENCE', action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' })
      checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()

      clickChange('Notes')
      completeAddNotePage({ journey: 'MANAGE', crnOverride: crn, value: notes })
      rowValue('Notes').should('contain', notes)

      clickChange('Sensitivity')
      completeAddNotePage({ journey: 'MANAGE', crnOverride: crn, value: notes, sensitivityIndex: 1 })
      rowValue('Sensitivity').should('contain.text', 'No')

      clickChange('Enforcement action')
      completeAction({ outcome: 'UNACCEPTABLE_ABSENCE', action: 'SEND_LETTER' })
      rowValue('What was the outcome of this appointment?').should('contain.text', 'Unacceptable absence')
      rowValue('Enforcement action').should('contain.text', 'I will send a first warning letter')
      rowValue('Notes').should('contain', notes)
      rowValue('Sensitivity').should('contain.text', 'No')

      clickChange('What was the outcome of this appointment?')
      completeOutcome({ outcome: 'ATTENDED_FAILED_TO_COMPLY', action: 'NO_FURTHER_ACTION' })
      rowValue('What was the outcome of this appointment?').should('contain.text', 'Attended - failed to comply')
      rowValue('Enforcement action').should('contain.text', 'No further action')
      rowValue('Notes').should('contain', notes)
      rowValue('Sensitivity').should('contain.text', 'No')
      checkYourAnswersOutcomePage.getSubmitBtn().should('contain.text', 'Confirm this appointment')

      clickChange('Next appointment')
      completeNextAppointmentPage({ value: 'KEEP_TYPE', isOutcome: true })
      checkYourAnswersOutcomePage.checkPageTitle(
        'Check your answers then confirm the appointment outcome and next appointment',
      )
      rowValue('Appointment details').should(
        'contain.text',
        `${appointmentType} on Wednesday 21 February 2024 at 10:15am to 10:30am`,
      )
      rowValue('Next appointment').should('contain.text', `${appointmentType} on ${yesterday} at 9am to 10am`)
      checkYourAnswersOutcomePage
        .getSubmitBtn()
        .should('contain.text', 'Confirm appointment outcome and arrange appointment')
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
