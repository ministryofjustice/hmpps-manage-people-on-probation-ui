import { DateTime } from 'luxon'
import AddNotePage from '../../pages/appointmentOutcomes/add-note.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'
import { appointmentId } from '../appointments/imports/common'
import {
  completeAddNotePage,
  completeLocationDateTimePage,
  completeOutcome,
  completeRescheduleAppointmentPage,
  completeSentencePage,
  completeNextAppointmentJourney,
  completeTypePage,
  getUuid,
} from '../appointments/utils'
import { Journey } from './imports'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import CheckYourAnswersOutcomePage from '../../pages/appointmentOutcomes/check-your-answers.page'

const crn = 'X000001'
let manageAppointmentPage: ManageAppointmentPage
let rescheduleCheckYourAnswerPage: RescheduleCheckYourAnswerPage
let addNotePage: AddNotePage
let nextAppointmentPage: NextAppointmentPage
let checkYourAnswersPage: AppointmentCheckYourAnswersPage
let checkYourAnswersOutcomePage: CheckYourAnswersOutcomePage

const loadNextAppointmentPage = (): void => {
  cy.task('stubAppointment', { isFuture: false })
  cy.visit(`/case/X000001/appointments/appointment/${appointmentId}/manage`)
  manageAppointmentPage = new ManageAppointmentPage()
  manageAppointmentPage.getTaskLink(1).click()
  completeOutcome()
  getUuid(3).then(uuid => {
    addNotePage = new AddNotePage()
    completeAddNotePage({ crnOverride: crn, idOverride: uuid })
  })
}

const completeArrangeAppointmentJourney = () => {
  completeSentencePage()
  completeTypePage()
  completeLocationDateTimePage({ dateInPast: true })
  completeOutcome({ outcome: 'ATTENDED_FAILED_TO_COMPLY', action: 'NO_FURTHER_ACTION' })
  completeAddNotePage()
}

const completeRescheduleJourney = () => {
  completeRescheduleAppointmentPage({ crn })
  rescheduleCheckYourAnswerPage = new RescheduleCheckYourAnswerPage()
  rescheduleCheckYourAnswerPage.getSubmitBtn().click()
  getUuid(2).then(uuid => {
    completeLocationDateTimePage({ dateInPast: true, crnOverride: crn, uuidOveride: uuid })
  })
  completeOutcome()
  getUuid(3).then(uuid => {
    addNotePage = new AddNotePage()
    completeAddNotePage({ crnOverride: crn, idOverride: uuid })
  })
}

const past = DateTime.now().minus({ days: 1 })
const future = DateTime.now().plus({ days: 2 })
const expectedPastDate = `${past.toFormat('cccc d LLLL yyyy')} at 9am to 10am`
const expectedFutureDate = `${future.toFormat('cccc d LLLL yyyy')} at 9am to 10am`

const checkNextAppointment = ({ journey = 'MANAGE' }: { journey?: Journey } = {}) => {
  if (journey === 'MANAGE') {
    describe('Arrange next supervision appointment in the past', () => {
      beforeEach(() => {
        loadNextAppointmentPage()
      })
      it('should complete next appointment journey and link to the outcome check your answers page', () => {
        nextAppointmentPage = new NextAppointmentPage()
        nextAppointmentPage.checkPageTitle('Eula’s next supervision appointment')
        cy.get('.govuk-inset-text').should(
          'contain.text',
          '3 way meeting (NS) on Wednesday 21 February 2024 at 10:15am with Terry Jones for their Default Sentence Type (12 Months)',
        )
        cy.get('[data-qa=anotherAppointment]')
          .find('legend')
          .should('contain.text', 'Do you want to arrange another appointment with Eula?')
        cy.get(`.govuk-radios__input[value=KEEP_TYPE]`).click()
        nextAppointmentPage.getSubmitBtn().click()
        completeNextAppointmentJourney({ dateInPast: true, isOutcomeJourney: true })
        checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
        checkYourAnswersOutcomePage.checkPageTitle(
          'Check your answers then confirm the appointment outcome and next appointment',
        )
        cy.get('.govuk-summary-list')
          .find('.govuk-summary-list__row')
          .eq(0)
          .find('.govuk-summary-list__value')
          .should('contain.text', '3 way meeting (NS) on Wednesday 21 February 2024 at 10:15am to 10:30am')
        cy.get('.govuk-summary-list')
          .find('.govuk-summary-list__row')
          .eq(4)
          .find('.govuk-summary-list__value')
          .should('contain.text', `3 way meeting (NS) on ${expectedPastDate}`)
      })
    })

    describe('arrange next supervision appointment in the future', () => {
      beforeEach(() => {
        loadNextAppointmentPage()
      })
      it('should complete next appointment journey and link to the outcome check your answers page', () => {
        nextAppointmentPage = new NextAppointmentPage()
        cy.get(`.govuk-radios__input[value=CHANGE_TYPE]`).click()
        nextAppointmentPage.getSubmitBtn().click()
        completeNextAppointmentJourney({ type: 'CHANGE_TYPE', dateInPast: false, isOutcomeJourney: true })
        checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
        checkYourAnswersOutcomePage.checkPageTitle(
          'Check your answers then confirm the appointment outcome and next appointment',
        )
        cy.get('.govuk-summary-list')
          .find('.govuk-summary-list__row')
          .eq(0)
          .find('.govuk-summary-list__value')
          .should('contain.text', '3 way meeting (NS) on Wednesday 21 February 2024 at 10:15am to 10:30am')

        cy.get('.govuk-summary-list')
          .find('.govuk-summary-list__row')
          .eq(4)
          .find('.govuk-summary-list__value')
          .should('contain.text', `Planned office visit (NS) on ${expectedFutureDate}`)
      })
    })
    describe('No next appointment arranged', () => {
      beforeEach(() => {
        loadNextAppointmentPage()
      })
      it('should redirect to the outcome check your answers page', () => {
        cy.get(`.govuk-radios__input[value=NO]`).click()
        nextAppointmentPage.getSubmitBtn().click()
        checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
      })
    })
  }
  if (journey === 'RESCHEDULE') {
    it('should not display the next appointment page and redirect to the reschedule cya page', () => {
      completeRescheduleJourney()
      checkYourAnswersPage = new AppointmentCheckYourAnswersPage()
      checkYourAnswersPage.checkPageTitle('Change appointment details and reschedule')
    })
  }
  if (journey === 'ARRANGE') {
    it('should not display the next appointment page and redirect to the cya page', () => {
      completeArrangeAppointmentJourney()
      checkYourAnswersPage = new AppointmentCheckYourAnswersPage()
      checkYourAnswersPage.checkPageTitle('Check your answers then confirm the appointment')
    })
  }
}

describe('Next supervision appointment', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })
  describe('Manage appointment journey', () => {
    checkNextAppointment()
  })
  describe('Reschedule appointment journey', () => {
    checkNextAppointment({ journey: 'RESCHEDULE' })
  })
  describe('Arrange appointment journey', () => {
    checkNextAppointment({ journey: 'ARRANGE' })
  })
})
