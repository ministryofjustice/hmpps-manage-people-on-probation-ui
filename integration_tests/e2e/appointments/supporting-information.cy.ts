import { checkPopHeader } from './imports'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AppointmentNotePage from '../../pages/appointments/note.page'
import { crn, uuid } from './imports/common'
import {
  completeSentencePage,
  completeTypePage,
  completeLocationDateTimePage,
  completeTextMessageConfirmationPage,
} from './utils'

const loadPage = () => {
  cy.visit(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
  completeSentencePage({ eventIndex: 1, crnOverride: crn })
  completeTypePage()
  completeLocationDateTimePage({ crnOverride: crn, allowSms: true })
  completeTextMessageConfirmationPage({ _crn: crn, _uuid: uuid, index: 1 })
}
let appointmentNotePage: AppointmentNotePage
describe('Add supporting information (optional)', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })

  it('should render the pop header', () => {
    loadPage()
    appointmentNotePage = new AppointmentNotePage()
    appointmentNotePage.checkOnPage()
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: 'X778160' })
  })
  it('should display validation errors if note is more than 12000 character', () => {
    loadPage()
    appointmentNotePage = new AppointmentNotePage()
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
    appointmentNotePage = new AppointmentNotePage()
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
    loadPage()
    appointmentNotePage = new AppointmentNotePage()
    cy.get('textarea').clear()
    cy.get('textarea').type('A test note')
    appointmentNotePage.getSubmitBtn().click()
    appointmentNotePage.checkErrorSummaryBox([
      'Select whether or not the appointment note contains sensitive information',
    ])
    appointmentNotePage.getElement(`#appointments-${crn}-${uuid}-sensitivity-error`).should($error => {
      expect($error.text().trim()).to.include(
        'Select whether or not the appointment note contains sensitive information',
      )
    })
  })
  it('should be on the check your answers page', () => {
    loadPage()
    appointmentNotePage = new AppointmentNotePage()
    cy.get(`#appointments-${crn}-${uuid}-sensitivity-2`).click()
    appointmentNotePage.getSubmitBtn().click()
    const checkYourAnswersPage = new AppointmentCheckYourAnswersPage()
    checkYourAnswersPage.checkPageTitle('Check your answers')
  })
})
