import {
  crn,
  uuid,
  completeTypePage,
  completeSentencePage,
  checkPopHeader,
  completeLocationDateTimePage,
} from './imports'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AppointmentNotePage from '../../pages/appointments/note.page'

const loadPage = () => {
  cy.visit(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
  completeSentencePage()
  completeTypePage()
  completeLocationDateTimePage()
}

describe('Add supporting information (optional)', () => {
  let appointmentNotePage: AppointmentNotePage
  beforeEach(() => {
    cy.task('stubNoRepeats')
    loadPage()
    appointmentNotePage = new AppointmentNotePage()
  })
  afterEach(() => {
    cy.task('resetMocks')
  })
  it('should be on add supporting information (optional) page', () => {
    appointmentNotePage.checkOnPage()
  })
  it('should render the pop header', () => {
    checkPopHeader('Alton Berge', true)
  })

  it('should display validation errors if note is more than 12000 character', () => {
    loadPage()
    const note = 'x'.repeat(12001)
    cy.get(`#appointments-${crn}-${uuid}-notes`).invoke('val', note).trigger('input')
    cy.get(`#appointments-${crn}-${uuid}-sensitivity-2`).click()
    appointmentNotePage.getSubmitBtn().click()
    appointmentNotePage.checkErrorSummaryBox(['Note must be 12000 characters or less'])
    appointmentNotePage
      .getElement(`#appointments-${crn}-${uuid}-notes-error`)
      .should('contain.text', 'Note must be 12000 characters or less')
    cy.get('.govuk-character-count__status').should('contain.text', 'You have 1 character too many')
  })

  it('should count a return as 1 character', () => {
    loadPage()
    cy.get(`#appointments-${crn}-${uuid}-notes`).then($el => {
      const paragraph = 'x'.repeat(6000)
      const value = `${paragraph}\n\n${paragraph}`
      $el.val(value)
      $el[0].dispatchEvent(new Event('input', { bubbles: true }))
    })
    cy.get(`#appointments-${crn}-${uuid}-sensitivity-2`).click()
    appointmentNotePage.getSubmitBtn().click()
    appointmentNotePage.checkErrorSummaryBox(['Note must be 12000 characters or less'])
    appointmentNotePage
      .getElement(`#appointments-${crn}-${uuid}-notes-error`)
      .should('contain.text', 'Note must be 12000 characters or less')
    cy.get('.govuk-character-count__status').should('contain.text', 'You have 2 characters too many')
  })
  it('should show validation errors if sensitivity option is not selected', () => {
    cy.get('textarea').clear()
    cy.get('textarea').type('A test note')
    appointmentNotePage.getSubmitBtn().click()
    it('should display the error summary box', () => {
      appointmentNotePage.checkErrorSummaryBox([
        'Select whether or not the appointment note contains sensitive information',
      ])
    })
    it('should display the error messages', () => {
      appointmentNotePage.getElement(`#appointments-${crn}-${uuid}-sensitivity-error`).should($error => {
        expect($error.text().trim()).to.include(
          'Select whether or not the appointment note contains sensitive information',
        )
      })
    })
  })
  it('should be on the check your answers page', () => {
    cy.get(`#appointments-${crn}-${uuid}-sensitivity-2`).click()
    appointmentNotePage.getSubmitBtn().click()
    const checkYourAnswersPage = new AppointmentCheckYourAnswersPage()
    checkYourAnswersPage.checkOnPage()
  })
  it('should check for correct text', () => {
    cy.get('[data-qa="visorReport"]').should(
      'contain.text',
      'This is information that you believe must be recorded but not shared with a person on probation. If they make a request for their record, the Data Protection Team will decide whether the information can be shared.',
    )
  })
})
