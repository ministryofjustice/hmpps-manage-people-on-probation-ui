import {
  crn,
  uuid,
  completeTypePage,
  completeSentencePage,
  completeAttendancePage,
  completeLocationPage,
  completeDateTimePage,
} from './imports'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AppointmentNotePage from '../../pages/appointments/note.page'

const loadPage = () => {
  cy.visit(`/case/${crn}/arrange-appointment/${uuid}/type`)
  completeTypePage()
  completeSentencePage()
  completeAttendancePage()
  completeLocationPage()
  completeDateTimePage()
}

describe('Add a note', () => {
  let appointmentNotePage: AppointmentNotePage
  beforeEach(() => {
    cy.task('stubNoRepeats')
    loadPage()
    appointmentNotePage = new AppointmentNotePage()
  })
  afterEach(() => {
    cy.task('resetMocks')
  })
  it('should be on add note page', () => {
    appointmentNotePage.checkOnPage()
  })
  it('should show validation errors if a note is entered and no sensitivity option is selected', () => {
    cy.get('textarea').clear()
    cy.get('textarea').type('A test note')
    appointmentNotePage.getSubmitBtn().click()
    it('should display the error summary box', () => {
      appointmentNotePage.checkErrorSummaryBox(['Select if appointment includes sensitive information'])
    })
    it('should display the error messages', () => {
      appointmentNotePage.getElement(`#appointments-${crn}-${uuid}-sensitivity-error`).should($error => {
        expect($error.text().trim()).to.include('Select if appointment includes sensitive information')
      })
    })
  })
  it('should be on the check your answers page', () => {
    cy.get(`#appointments-${crn}-${uuid}-sensitivity-2`).click()
    appointmentNotePage.getSubmitBtn().click()
    const checkYourAnswersPage = new AppointmentCheckYourAnswersPage()
    checkYourAnswersPage.checkOnPage()
  })
})
