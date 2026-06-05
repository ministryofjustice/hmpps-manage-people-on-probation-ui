import {
  AcceptableAbsenceOutcomeType,
  AppointmentEnforcementAction,
  AppointmentOutcomeType,
  EnforcementActionCreatedBy,
} from '../../../server/models/Appointments'
import CheckYourAnswersOutcomePage from '../../pages/appointmentOutcomes/check-your-answers.page'
import ConfirmationOutcomePage from '../../pages/appointmentOutcomes/confirmation.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import OverviewPage from '../../pages/overview'
import { appointmentId, crn } from '../appointments/imports/common'
import { completeOutcome, completeAddNotePage } from '../appointments/utils'

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

const loadPage = ({ outcome = 'ATTENDED_COMPLIED', action = null, letterSentBy = null }: Props = {}): void => {
  cy.task('stubAppointment', { eventId: '2501192724', isFuture: false })
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
  manageAppointmentPage = new ManageAppointmentPage()
  manageAppointmentPage.getTaskLink(1).click()
  completeOutcome({ outcome, action, letterSentBy })
  completeAddNotePage({ journey: 'MANAGE', crnOverride: crn })
  nextAppointmentPage = new NextAppointmentPage()
  cy.get(`.govuk-radios__input[value=NO]`).click()
  nextAppointmentPage.getSubmitBtn().click()
  checkYourAnswersOutcomePage = new AppointmentCheckYourAnswersPage()
  checkYourAnswersOutcomePage.getSubmitBtn().click()
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
      it(`should add the correct confirmation to res.locals.appointmentOutcome.confirmation if outcome is ${outcome.outcomeType}`, () => {
        loadPage(outcome)
        confirmationPage = new ConfirmationOutcomePage()
        confirmationPage.checkPageTitle('Appointment outcome updated')
        confirmationPage.getType().should('contain.text', '3 Way Meeting (NS)')
        confirmationPage.getDate().should('contain.text', 'Wednesday 21 February 2024 from 10:15am to 10:30am')
        confirmationPage
          .getWhatHappensNextText()
          .should('contain.text', 'This outcome has been saved against the appointment on NDelius.')
        confirmationPage.getWhatHappensNextText().should('have.length', 1)
        confirmationPage.getFurtherActionLinks().eq(0).should('contain.text', 'arrange another appointment')
        confirmationPage.getFurtherActionLinks().eq(1).should('contain.text', 'log outcomes for 3 appointments')
        confirmationPage.getFurtherActionLinks().should('have.length', 2)
      })
    })
  })

  describe('Appointment type is COMMUNITY and enforcement letter is sent by case admin', () => {
    it(`should add the correct confirmation to res.locals.appointmentOutcome.confirmation`, () => {
      loadPage({
        outcome: 'ATTENDED_FAILED_TO_COMPLY',
        action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
        letterSentBy: 'CASE_ADMIN',
      })
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome added')
      confirmationPage
        .getWhatHappensNextText()
        .eq(0)
        .should('contain.text', 'This enforcement outcome has been added to the NDelius Enforcement Diary.')
      confirmationPage
        .getWhatHappensNextText()
        .eq(1)
        .should('contain.text', 'Follow your local process to request a licence compliance letter.')
      confirmationPage.getWhatHappensNextText().should('have.length', 2)
      confirmationPage.getFurtherActionLinks().eq(0).should('contain.text', 'arrange another appointment')
      confirmationPage.getFurtherActionLinks().eq(1).should('contain.text', 'log outcomes for 3 appointments')
      confirmationPage.getFurtherActionLinks().should('have.length', 2)
    })
  })

  describe('Appointment type is CUSTODY and enforcement letter is sent by case admin', () => {
    it(`should add the correct confirmation to res.locals.appointmentOutcome.confirmation`, () => {
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
        .eq(0)
        .should('contain.text', 'This enforcement outcome has been added to the NDelius Enforcement Diary.')
      confirmationPage
        .getWhatHappensNextText()
        .eq(1)
        .should('contain.text', 'Follow your local process to request a licence compliance letter.')
      confirmationPage.getWhatHappensNextText().should('have.length', 2)
      confirmationPage.getFurtherActionLinks().eq(0).should('contain.text', 'use the Consider a recall service')
      confirmationPage.getFurtherActionLinks().eq(1).should('contain.text', 'arrange another appointment')
      confirmationPage.getFurtherActionLinks().eq(2).should('contain.text', 'log outcomes for 3 appointments')
      confirmationPage.getFurtherActionLinks().should('have.length', 3)
    })
  })

  describe('Appointment type is COMMUNITY and enforcement letter is sent by PP', () => {
    it(`should add the correct confirmation to res.locals.appointmentOutcome.confirmation`, () => {
      loadPage({
        outcome: 'ATTENDED_FAILED_TO_COMPLY',
        action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
        letterSentBy: 'USER',
      })
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome added')
      confirmationPage
        .getWhatHappensNextText()
        .eq(0)
        .should('contain.text', 'This enforcement outcome has been added to the NDelius Enforcement Diary.')
      confirmationPage
        .getWhatHappensNextText()
        .eq(1)
        .should('contain.text', 'Your case administrator or you will create and send a licence compliance letter.')
      confirmationPage.getWhatHappensNextText().should('have.length', 2)
      confirmationPage.getFurtherAction().should('not.exist')
    })
  })

  describe('Enforcement action is breach/recall initiated and is not added to NDelius diary', () => {
    it(`should add the correct confirmation to res.locals.appointmentOutcome.confirmation`, () => {
      loadPage({
        outcome: 'ATTENDED_FAILED_TO_COMPLY',
        action: 'BREACH_RECALL_INITIATED',
      })

      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome added')
      confirmationPage
        .getWhatHappensNextText()
        .eq(0)
        .should('contain.text', 'This outcome has been saved against the appointment on NDelius.')
      confirmationPage
        .getWhatHappensNextText()
        .eq(1)
        .should('contain.text', 'Liaise with your case administrator to create a breach/recall NSI on NDelius.')
      confirmationPage.getWhatHappensNextText().should('have.length', 2)
      confirmationPage.getFurtherActionLinks().eq(0).should('contain.text', 'arrange another appointment')
      confirmationPage.getFurtherActionLinks().eq(1).should('contain.text', 'log outcomes for 3 appointments')
      confirmationPage.getFurtherActionLinks().should('have.length', 2)
    })
  })

  describe('Enforcement action is not letter and is added to NDelius diary', () => {
    it(`should add the correct confirmation to res.locals.appointmentOutcome.confirmation`, () => {
      loadPage({
        outcome: 'FAILED_TO_ATTEND',
        action: 'REFER_TO_OFFENDER_MANAGER',
      })
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Enforcement outcome added')
      confirmationPage
        .getWhatHappensNextText()
        .eq(0)
        .should('contain.text', 'This enforcement outcome has been added to the NDelius Enforcement Diary.')
      confirmationPage.getWhatHappensNextText().should('have.length', 1)
      confirmationPage.getFurtherActionLinks().eq(0).should('contain.text', 'arrange another appointment')
      confirmationPage.getFurtherActionLinks().eq(1).should('contain.text', 'log outcomes for 3 appointments')
      confirmationPage.getFurtherActionLinks().should('have.length', 2)
    })
  })

  describe('Outcome is UNACCEPTABLE_ABSENCE', () => {
    it(`should add the correct confirmation to res.locals.appointmentOutcome.confirmation`, () => {
      loadPage({
        outcome: 'UNACCEPTABLE_ABSENCE',
        action: 'BREACH_RECALL_INITIATED',
      })
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('Unacceptable absence outcome added')
      confirmationPage
        .getWhatHappensNextText()
        .eq(0)
        .should('contain.text', 'This outcome has been saved against the appointment on NDelius.')
      confirmationPage.getWhatHappensNextText().should('have.length', 1)
      confirmationPage.getFurtherActionLinks().eq(0).should('contain.text', 'arrange another appointment')
      confirmationPage.getFurtherActionLinks().eq(1).should('contain.text', 'log outcomes for 3 appointments')
      confirmationPage.getFurtherActionLinks().should('have.length', 2)
    })
  })

  describe('Enforcement action is NO_FURTHER_ACTION', () => {
    it(`should add the correct confirmation to res.locals.appointmentOutcome.confirmation`, () => {
      loadPage({
        outcome: 'UNACCEPTABLE_ABSENCE',
        action: 'NO_FURTHER_ACTION',
      })
      confirmationPage = new ConfirmationOutcomePage()
      confirmationPage.checkPageTitle('No further action outcome added')
      confirmationPage
        .getWhatHappensNextText()
        .eq(0)
        .should('contain.text', 'This outcome has been saved against the appointment on NDelius.')
      confirmationPage.getWhatHappensNextText().should('have.length', 1)
      confirmationPage.getFurtherActionLinks().eq(0).should('contain.text', 'arrange another appointment')
      confirmationPage.getFurtherActionLinks().eq(1).should('contain.text', 'log outcomes for 3 appointments')
      confirmationPage.getFurtherActionLinks().should('have.length', 2)
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
