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
  completeSupportingInformationPage,
  completeTextMessageConfirmationPage,
  completeTypePage,
  getUuid,
} from '../appointments/utils'
import { Journey } from './imports'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import CheckYourAnswersOutcomePage from '../../pages/appointmentOutcomes/check-your-answers.page'
import { dateWithYear } from '../../../server/utils'
import { AppointmentSessionSelection } from '../../../server/models/Appointments'

const crn = 'X000001'
let manageAppointmentPage: ManageAppointmentPage
let rescheduleCheckYourAnswerPage: RescheduleCheckYourAnswerPage
let addNotePage: AddNotePage
let nextAppointmentPage: NextAppointmentPage
let arrangeAnotherAppointmentPage: ArrangeAnotherAppointmentPage
let checkYourAnswersPage: AppointmentCheckYourAnswersPage
let confirmationPage: AppointmentConfirmationPage
let checkYourAnswersOutcomePage: CheckYourAnswersOutcomePage
const expectedDate = dateWithYear(DateTime.now().toFormat('yyyy-MM-dd'))

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

const completeNextAppointment = ({
  type = 'KEEP_TYPE',
  dateInPast = false,
  sensitivityIsLocked = false,
}: {
  type?: AppointmentSessionSelection
  dateInPast?: boolean
  sensitivityIsLocked?: boolean
} = {}): void => {
  if (type === 'KEEP_TYPE') {
    arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    arrangeAnotherAppointmentPage.getSubmitBtn().click()
  }
  getUuid(2).then(uuid => {
    if (type === 'CHANGE_TYPE') {
      completeSentencePage({ loadPage: false, crnOverride: crn, uuidOverride: uuid })
      completeTypePage()
    }
    if (['KEEP_TYPE', 'CHANGE_TYPE'].includes(type)) {
      completeLocationDateTimePage({ dateInPast, crnOverride: crn, uuidOveride: uuid })
    }
    if (!dateInPast) {
      completeTextMessageConfirmationPage({ _crn: crn, _uuid: uuid, index: 1 })
      completeSupportingInformationPage({ crnOverride: crn, uuidOveride: uuid, sensitivityIsLocked })
    } else {
      completeOutcome()
      completeAddNotePage({ crnOverride: crn, idOverride: uuid, sensitivityIsLocked })
    }
    checkYourAnswersPage = new AppointmentCheckYourAnswersPage()
    checkYourAnswersPage.getSubmitBtn().click()
  })
}

const checkNextAppointment = ({ journey = 'MANAGE' }: { journey?: Journey } = {}) => {
  if (journey === 'MANAGE') {
    describe('Arrange next supervision appointment in the past', () => {
      beforeEach(() => {
        loadNextAppointmentPage()
      })
      it('should complete next appointment journey and link back to outcome check your answers page', () => {
        nextAppointmentPage = new NextAppointmentPage()
        nextAppointmentPage.checkPageTitle('Eula’s next supervision appointment')
        cy.get('.govuk-inset-text').should(
          'contain.text',
          '3 way meeting (NS) on Wednesday 21 February 2024 at 10:15am with Eula Schmeler for their Default Sentence Type (12 Months)',
        )
        cy.get('[data-qa=anotherAppointment]')
          .find('legend')
          .should('contain.text', 'Do you want to arrange another appointment with Eula?')
        cy.get(`.govuk-radios__input[value=KEEP_TYPE]`).click()
        nextAppointmentPage.getSubmitBtn().click()
        completeNextAppointment({ dateInPast: true })
        confirmationPage = new AppointmentConfirmationPage()
        confirmationPage.checkPageTitle('Past appointment arranged')
        cy.get('[data-qa=logAppointmentOutcome]')
          .find('p')
          .should('contain.text', `You can now finish logging the outcome for 3 Way Meeting (NS) on ${expectedDate}`)
        cy.get('[data-qa="submit-btn"]').should('contain.text', 'Return to log appointment outcome').click()
        checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
      })
    })

    describe('arrange next supervision appointment in the future', () => {
      beforeEach(() => {
        loadNextAppointmentPage()
      })
      it('should complete next appointment journey and link back to outcome check your answers page', () => {
        nextAppointmentPage = new NextAppointmentPage()
        cy.get(`.govuk-radios__input[value=CHANGE_TYPE]`).click()
        nextAppointmentPage.getSubmitBtn().click()
        completeNextAppointment({ type: 'CHANGE_TYPE', dateInPast: false, sensitivityIsLocked: true })
        confirmationPage = new AppointmentConfirmationPage()
        confirmationPage.checkPageTitle('Appointment arranged')
        cy.get('[data-qa=logAppointmentOutcome]')
          .find('p')
          .should('contain.text', `You can now finish logging the outcome for 3 Way Meeting (NS) on ${expectedDate}`)
        cy.get('[data-qa="submit-btn"]').should('contain.text', 'Return to log appointment outcome').click()
        checkYourAnswersOutcomePage = new CheckYourAnswersOutcomePage()
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
      checkYourAnswersOutcomePage = new AppointmentCheckYourAnswersPage()
      checkYourAnswersPage.checkPageTitle('Change appointment details and reschedule')
    })
  }
  if (journey === 'ARRANGE') {
    it('should not display the next appointment page and redirect to the cya page', () => {
      completeArrangeAppointmentJourney()
      checkYourAnswersOutcomePage = new AppointmentCheckYourAnswersPage()
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
