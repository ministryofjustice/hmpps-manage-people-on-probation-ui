import { checkPopHeader } from './imports'
import { crn } from './imports/common'
import AttendedFailedToComplyPage from '../../pages/appointments/attended-failed-to-comply.page'

const contactId = '123456'
const loadPage = (_crn = crn) => {
  cy.visit(`/case/${_crn}/appointments/appointment/${contactId}/attended-failed-to-comply`)
}

describe('Attended but failed to comply', () => {
  let attendedFailedToComplyPage: AttendedFailedToComplyPage

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubProbationSearch')
    cy.task('stubDeliusPersonalDetails', { crn })
    cy.task('stubBreachRecallInformation', { crn, data: 'Initiate a breach' })
    cy.task('stubProbationPractitioner', { crn, username: 'USER1' })
    cy.task('stubPersonAppointment', { crn, contactId, type: 'Office visit' })
    loadPage()
    attendedFailedToComplyPage = new AttendedFailedToComplyPage('Alton')
  })

  it('should render the pop header', () => {
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: 'X778160' })
  })

  it('should display the correct radio buttons when isReferToProbationPractitioner is true', () => {
    cy.get('.govuk-radios').find('.govuk-radios__item').should('have.length', 6)
    cy.get('label[for="appointments-X778160-123456-enforcementAction"]').should('contain.text', 'Send a letter')
    cy.get('label[for="appointments-X778160-123456-enforcementAction-2"]').should('contain.text', 'Initiate a breach')
    cy.get('label[for="appointments-X778160-123456-enforcementAction-3"]').should(
      'contain.text',
      'Initiate a breach and send a letter',
    )
    cy.get('label[for="appointments-X778160-123456-enforcementAction-4"]').should(
      'contain.text',
      'Refer to probation practitioner',
    )
    cy.get('.govuk-hint').should('contain.text', 'Notify the allocated probation practitioner so they can take action.')
    cy.get('label[for="appointments-X778160-123456-enforcementAction-5"]').should('contain.text', 'No further action')
    cy.get('.govuk-radios__divider').should('contain.text', 'or')
    cy.get('label[for="appointments-X778160-123456-enforcementAction-7"]').should(
      'contain.text',
      'I want to add a different action',
    )
  })

  it('should display the correct radio buttons when isReferToProbationPractitioner is false', () => {
    cy.task('stubProbationPractitioner', { crn, username: 'OTHER_USER' })
    cy.task('stubPersonAppointment', { crn, contactId, type: 'Office visit' })
    loadPage()
    cy.get('.govuk-radios').find('.govuk-radios__item').should('have.length', 5)
    cy.get('label').should('not.contain.text', 'Refer to probation practitioner')
  })

  it('should show validation error when no option is selected', () => {
    cy.get('button.govuk-button').contains('Continue').click()
    cy.get('.govuk-error-summary').should('be.visible')
    cy.get('.govuk-error-summary__title').should('contain.text', 'There is a problem')
    cy.get('.govuk-error-summary__list').should('contain.text', 'Select an action for their failure to comply')
    cy.get('#appointments-X778160-123456-enforcementAction-error').should(
      'contain.text',
      'Select an action for their failure to comply',
    )
  })

  it('should have the correct back link', () => {
    attendedFailedToComplyPage.getBackLink().should('have.attr', 'href', `/case/${crn}/appointments`)
  })
})
