import {
  AcceptableAbsenceOutcomeType,
  AppointmentEnforcementAction,
  AppointmentOutcomeType,
  AppointmentSessionSelection,
  EnforcementActionCreatedBy,
} from '../../../server/models/Appointments'
import CheckYourAnswersOutcomePage from '../../pages/appointmentOutcomes/check-your-answers.page'
import ConfirmationOutcomePage from '../../pages/appointmentOutcomes/confirmation.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import OverviewPage from '../../pages/overview'
import { appointmentId, crn } from '../appointments/imports/common'
import { completeOutcome, completeAddNotePage, completeNextAppointmentJourney } from '../appointments/utils'

let manageAppointmentPage: ManageAppointmentPage
let checkYourAnswersOutcomePage: CheckYourAnswersOutcomePage
let confirmationPage: ConfirmationOutcomePage
let nextAppointmentPage: NextAppointmentPage
let overviewPage: OverviewPage

interface Props {
  outcome?: AppointmentOutcomeType
  action?: AppointmentEnforcementAction | AcceptableAbsenceOutcomeType
  letterSentBy?: EnforcementActionCreatedBy
}

const loadPage = (
  { outcome = 'ATTENDED_COMPLIED', action = null, letterSentBy = null }: Props = {},
  nextAppointment: AppointmentSessionSelection = 'NO',
): void => {
  cy.task('stubAppointment', { eventId: '2501192724', isFuture: false })
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
  manageAppointmentPage = new ManageAppointmentPage()
  manageAppointmentPage.getTaskLink(1).click()
  completeOutcome({ outcome, action, letterSentBy })
  completeAddNotePage({ journey: 'MANAGE', crnOverride: crn })
  nextAppointmentPage = new NextAppointmentPage()
  cy.get(`.govuk-radios__input[value=${nextAppointment}]`).click()
  nextAppointmentPage.getSubmitBtn().click()
  if (['KEEP_TYPE', 'CHANGE_TYPE'].includes(nextAppointment)) {
    completeNextAppointmentJourney({ type: nextAppointment, dateInPast: true, isOutcomeJourney: true, crn })
  }
  checkYourAnswersOutcomePage = new AppointmentCheckYourAnswersPage()
  checkYourAnswersOutcomePage.getSubmitBtn().click()
}

const checkNextAppointmentText = () => {
  confirmationPage
    .getWhatHappensNextText()
    .should('contain.text', 'You’ve arranged a 3 way meeting (NS) on Wednesday 2 September 2026 at 9am to 10am.')
    .should('contain.text', 'Alton will receive a confirmation text message with the new appointment details.')
    .should('contain.text', 'The new appointment has been added to:')
    .should('contain.text', 'your calendar')
    .should('contain.text', 'the NDelius contact log and officer diary, along with any supporting information')
}

const checkFurtherActions = ({ hasRecallService = true } = {}) => {
  if (hasRecallService) {
    confirmationPage.getFurtherActionLinks().eq(0).should('contain.text', 'use the Consider a recall service')
  }
  confirmationPage
    .getFurtherActionLinks()
    .eq(hasRecallService ? 1 : 0)
    .should('contain.text', 'arrange another appointment')
  confirmationPage
    .getFurtherActionLinks()
    .eq(hasRecallService ? 2 : 1)
    .should('contain.text', 'log outcomes for 3 appointments')
  confirmationPage.getFurtherActionLinks().should('have.length', hasRecallService ? 3 : 2)
}

const checkPage = () => {
  describe('Outcome is Attended and complied, Attended but sent home due to service issues or Acceptable absence', () => {
    const outcomes: {
      outcomeType: AppointmentOutcomeType
      action?: AppointmentEnforcementAction | AcceptableAbsenceOutcomeType
    }[] = [
      { outcomeType: 'ATTENDED_COMPLIED' },
      { outcomeType: 'ATTENDED_SENT_HOME_SERVICE_ISSUES', action: 'NO_FURTHER_ACTION' },
      { outcomeType: 'ACCEPTABLE_ABSENCE', action: 'ACCEPTABLE_ABSENCE_HOLIDAY' },
    ]
    outcomes.forEach(outcome => {
      it(`should display the correct confirmation if outcome is ${outcome.outcomeType}`, () => {
        loadPage(outcome)
        confirmationPage = new ConfirmationOutcomePage()
        confirmationPage.checkPageTitle('Appointment outcome updated')
        confirmationPage.getType().should('contain.text', '3 way meeting (NS)')
        confirmationPage.getDate().should('contain.text', 'Wednesday 21 February 2024 from 10:15am to 10:30am')
        confirmationPage
          .getWhatHappensNextText()
          .should('contain.text', 'This outcome has been saved against the appointment on NDelius.')
        confirmationPage.getWhatHappensNextText().should('have.length', 1)
        checkFurtherActions({ hasRecallService: false })
      })
    })

    outcomes.forEach(outcome => {
      it(`should display the correct confirmation if outcome is ${outcome.outcomeType} and next appointment is arranged`, () => {
        loadPage(outcome, 'KEEP_TYPE')
        confirmationPage = new ConfirmationOutcomePage()
        confirmationPage.checkPageTitle('Outcome updated and next appointment arranged')
        confirmationPage.getType().should('not.exist')
        confirmationPage.getDate().should('not.exist')
        confirmationPage
          .getWhatHappensNextText()
          .should('contain.text', 'This outcome has been saved against the appointment on NDelius.')
        checkNextAppointmentText()
        checkFurtherActions({ hasRecallService: false })
      })
    })
  })

  describe('Appointment type is COMMUNITY and enforcement letter is sent by case admin', () => {
    it(`should display the correct confirmation`, () => {
      loadPage({
        outcome: 'ATTENDED_FAILED_TO_COMPLY',
        action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
        letterSentBy: 'CASE_ADMIN',
      })
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome added')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This enforcement outcome has been added to the NDelius Enforcement Diary.')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'Follow your local process to request a other enforcement letter.')
      confirmationPage.getWhatHappensNextText().find('p').should('have.length', 2)
      checkFurtherActions({ hasRecallService: false })
    })
    it(`should display the correct confirmation if next appointment is arranged`, () => {
      loadPage(
        {
          outcome: 'ATTENDED_FAILED_TO_COMPLY',
          action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
          letterSentBy: 'CASE_ADMIN',
        },
        'KEEP_TYPE',
      )
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome updated and next appointment arranged')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This enforcement outcome has been added to the NDelius Enforcement Diary.')
        .should('contain.text', 'Follow your local process to request a other enforcement letter.')
      checkNextAppointmentText()
      checkFurtherActions({ hasRecallService: false })
    })
  })

  describe('Appointment type is CUSTODY and enforcement letter is sent by case admin', () => {
    it(`should display the correct confirmation`, () => {
      cy.task('stubSentences', { sentenceType: 'CUSTODY' })
      loadPage({
        outcome: 'ATTENDED_FAILED_TO_COMPLY',
        action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
        letterSentBy: 'CASE_ADMIN',
      })
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome added')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This enforcement outcome has been added to the NDelius Enforcement Diary.')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'Follow your local process to request a other enforcement letter.')
      confirmationPage.getWhatHappensNextText().find('p').should('have.length', 2)
      checkFurtherActions()
    })
    it(`should display the correct confirmation if next appointment is arranged`, () => {
      cy.task('stubSentences', { sentenceType: 'CUSTODY' })
      loadPage(
        {
          outcome: 'ATTENDED_FAILED_TO_COMPLY',
          action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
          letterSentBy: 'CASE_ADMIN',
        },
        'KEEP_TYPE',
      )
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome updated and next appointment arranged')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This enforcement outcome has been added to the NDelius Enforcement Diary.')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'Follow your local process to request a other enforcement letter.')
      checkNextAppointmentText()
      checkFurtherActions()
    })
  })

  describe('Appointment type is COMMUNITY and enforcement letter is sent by PP', () => {
    it(`should display the correct confirmation`, () => {
      loadPage({
        outcome: 'ATTENDED_FAILED_TO_COMPLY',
        action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
        letterSentBy: 'USER',
      })
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome added')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This enforcement outcome has been added to the NDelius Enforcement Diary.')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'Your case administrator or you will create and send a other enforcement letter.')
      confirmationPage.getWhatHappensNextText().find('p').should('have.length', 2)
      confirmationPage.getFurtherAction().should('not.exist')
    })
    it(`should display the correct confirmation if next appointment is arranged`, () => {
      loadPage(
        {
          outcome: 'ATTENDED_FAILED_TO_COMPLY',
          action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
          letterSentBy: 'USER',
        },
        'KEEP_TYPE',
      )
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome updated and next appointment arranged')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This enforcement outcome has been added to the NDelius Enforcement Diary.')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'Your case administrator or you will create and send a other enforcement letter.')
      checkNextAppointmentText()
      checkFurtherActions()
    })
  })

  describe('Enforcement action is breach/recall initiated and is not added to NDelius diary', () => {
    it(`should display the correct confirmation`, () => {
      loadPage({
        outcome: 'ATTENDED_FAILED_TO_COMPLY',
        action: 'BREACH_RECALL_INITIATED',
      })

      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome added')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This outcome has been saved against the appointment on NDelius.')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'Liaise with your case administrator to create a breach/recall NSI on NDelius.')
      confirmationPage.getWhatHappensNextText().find('p').should('have.length', 2)
      checkFurtherActions({ hasRecallService: false })
    })
    it(`should display the correct confirmation if next appointment is arranged`, () => {
      loadPage(
        {
          outcome: 'ATTENDED_FAILED_TO_COMPLY',
          action: 'BREACH_RECALL_INITIATED',
        },
        'KEEP_TYPE',
      )
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome updated and next appointment arranged')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This outcome has been saved against the appointment on NDelius.')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'Liaise with your case administrator to create a breach/recall NSI on NDelius.')
      checkNextAppointmentText()
      checkFurtherActions({ hasRecallService: false })
    })
  })

  describe('Enforcement action is not letter and is added to NDelius diary', () => {
    it(`should display the correct confirmation`, () => {
      loadPage({
        outcome: 'FAILED_TO_ATTEND',
        action: 'REFER_TO_OFFENDER_MANAGER',
      })
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome added')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This enforcement outcome has been added to the NDelius Enforcement Diary.')
      confirmationPage.getWhatHappensNextText().find('p').should('have.length', 1)
      checkFurtherActions({ hasRecallService: false })
    })
    it(`should display the correct confirmation if next appointment is arranged`, () => {
      loadPage(
        {
          outcome: 'FAILED_TO_ATTEND',
          action: 'REFER_TO_OFFENDER_MANAGER',
        },
        'KEEP_TYPE',
      )
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome updated and next appointment arranged')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This enforcement outcome has been added to the NDelius Enforcement Diary.')
      checkNextAppointmentText()
      checkFurtherActions({ hasRecallService: false })
    })
  })

  describe('Outcome is UNACCEPTABLE_ABSENCE', () => {
    it(`should display the correct confirmation`, () => {
      loadPage({
        outcome: 'UNACCEPTABLE_ABSENCE',
        action: 'BREACH_RECALL_INITIATED',
      })
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Unacceptable absence outcome added')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This outcome has been saved against the appointment on NDelius.')
      confirmationPage.getWhatHappensNextText().find('p').should('have.length', 1)
      checkFurtherActions({ hasRecallService: false })
    })
    it(`should display the correct confirmation if next appointment arranged`, () => {
      loadPage(
        {
          outcome: 'UNACCEPTABLE_ABSENCE',
          action: 'BREACH_RECALL_INITIATED',
        },
        'KEEP_TYPE',
      )
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome updated and next appointment arranged')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This outcome has been saved against the appointment on NDelius.')
      checkNextAppointmentText()
      checkFurtherActions({ hasRecallService: false })
    })
  })

  describe('Enforcement action is NO_FURTHER_ACTION', () => {
    it(`should display the correct confirmation`, () => {
      loadPage({
        outcome: 'UNACCEPTABLE_ABSENCE',
        action: 'NO_FURTHER_ACTION',
      })
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('No further action outcome added')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This outcome has been saved against the appointment on NDelius.')
      confirmationPage.getWhatHappensNextText().find('p').should('have.length', 1)
      checkFurtherActions({ hasRecallService: false })
    })
    it(`should display the correct confirmation if next appointment is arranged`, () => {
      loadPage(
        {
          outcome: 'UNACCEPTABLE_ABSENCE',
          action: 'NO_FURTHER_ACTION',
        },
        'KEEP_TYPE',
      )
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Outcome updated and next appointment arranged')
      confirmationPage
        .getWhatHappensNextText()
        .should('contain.text', 'This outcome has been saved against the appointment on NDelius.')
      checkNextAppointmentText()
      checkFurtherActions({ hasRecallService: false })
    })
  })
  describe('User click the return to overview button', () => {
    it('should return to the overview page', () => {
      loadPage({
        outcome: 'UNACCEPTABLE_ABSENCE',
        action: 'NO_FURTHER_ACTION',
      })
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.getSubmitBtn().should('contain.text', 'Return to Alton’s overview').click()
      overviewPage = new OverviewPage()
      overviewPage.checkOnPage()
      cy.get('[data-qa=name]').should('contain.text', 'Alton Berge')
    })
  })
  describe('User click the return to manage appointment link', () => {
    it('should return to the manage appointment page', () => {
      loadPage({
        outcome: 'UNACCEPTABLE_ABSENCE',
        action: 'NO_FURTHER_ACTION',
      })
      confirmationPage = new ConfirmationOutcomePage()
      cy.get('[data-qa=returnToManageAppointment]').should('contain.text', 'Return to manage appointment').click()
      manageAppointmentPage = new ManageAppointmentPage()
      manageAppointmentPage.checkPageTitle('Manage 3 way meeting (NS) with Terry Jones')
    })
  })
}

describe('Confirmation - outcomes', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  describe('Manage appointment journey', () => {
    checkPage()
  })
})
