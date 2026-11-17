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
    const addNotePage = new AddNotePage()
    addNotePage.checkOnPage()
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
    const addNotePage = new AddNotePage()
    addNotePage.checkOnPage()
    completeAddNotePage({ crnOverride: crn, idOverride: uuid })
  })
}

const past = DateTime.now().minus({ days: 1 })
const future = DateTime.now().plus({ days: 2 })
const expectedPastDate = `${past.toFormat('cccc d LLLL yyyy')} at 9am to 10am`
const expectedFutureDate = `${future.toFormat('cccc d LLLL yyyy')} at 9am to 10am`

// Logs a named step (Given / When / Then / And) in the Cypress command log, so a failure shows which step it was
const step = (name: string, fn: () => void) => {
  cy.log(`**${name}**`)
  fn()
}

const checkNextAppointment = ({ journey = 'MANAGE' }: { journey?: Journey } = {}) => {
  if (journey === 'MANAGE') {
    it('summarises both appointments when the practitioner keeps the same type in the past', () => {
      step('Given I have logged the outcome and reached the next appointment step', () => {
        loadNextAppointmentPage()
        nextAppointmentPage = new NextAppointmentPage()
      })

      step('When I choose to keep the same appointment type and complete the new appointment journey', () => {
        cy.get(`.govuk-radios__input[value=KEEP_TYPE]`).click()
        nextAppointmentPage.getSubmitBtn().click()
        completeNextAppointmentJourney({ dateInPast: true, isOutcomeJourney: true })
      })

      step('Then the outcome check your answers page summarises both appointments', () => {
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

    it('offers to confirm the outcome and arrange the appointment when the practitioner changes type in the future', () => {
      step('Given I have logged the outcome and reached the next appointment step', () => {
        loadNextAppointmentPage()
        nextAppointmentPage = new NextAppointmentPage()
      })

      step('When I choose a different appointment type and complete the new appointment journey', () => {
        cy.get(`.govuk-radios__input[value=CHANGE_TYPE]`).click()
        nextAppointmentPage.getSubmitBtn().click()
        completeNextAppointmentJourney({ type: 'CHANGE_TYPE', dateInPast: false, isOutcomeJourney: true })
      })

      step('Then the outcome check your answers page summarises both appointments and offers to arrange it', () => {
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
        checkYourAnswersOutcomePage
          .getSubmitBtn()
          .should('contain.text', 'Confirm appointment outcome and arrange appointment')
      })
    })

    it('redirects to the outcome check your answers page when there is no further appointment', () => {
      step('Given I have logged the outcome and reached the next appointment step', () => {
        loadNextAppointmentPage()
        nextAppointmentPage = new NextAppointmentPage()
      })

      step('When I choose not to arrange another appointment and submit', () => {
        cy.get(`.govuk-radios__input[value=NO]`).click()
        nextAppointmentPage.getSubmitBtn().click()
      })

      step('Then I am sent straight to the outcome check your answers page', () => {
        checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
        checkYourAnswersOutcomePage.getSubmitBtn().should('contain.text', 'Confirm this appointment')
      })
    })
  }
  if (journey === 'RESCHEDULE') {
    it('does not display the next appointment page and redirects to the reschedule cya page', () => {
      step('When I complete the reschedule journey', () => {
        completeRescheduleJourney()
      })

      step('Then I am sent straight to the reschedule check your answers page', () => {
        checkYourAnswersPage = new AppointmentCheckYourAnswersPage()
        checkYourAnswersPage.checkPageTitle('Change appointment details and reschedule')
      })
    })
  }
  if (journey === 'ARRANGE') {
    it('does not display the next appointment page and redirects to the cya page', () => {
      step('When I complete the arrange appointment journey', () => {
        completeArrangeAppointmentJourney()
      })

      step('Then I am sent straight to the check your answers page', () => {
        checkYourAnswersPage = new AppointmentCheckYourAnswersPage()
        checkYourAnswersPage.checkPageTitle('Check your answers then confirm the appointment')
      })
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
