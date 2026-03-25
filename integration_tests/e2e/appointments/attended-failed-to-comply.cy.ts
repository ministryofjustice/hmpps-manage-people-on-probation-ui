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
    loadPage()
    attendedFailedToComplyPage = new AttendedFailedToComplyPage('Alton')
  })

  it('should render the pop header', () => {
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: 'X778160' })
  })

  it('should display the correct radio buttons', () => {
    cy.get('.govuk-radios').find('.govuk-radios__item').should('have.length', 5)
    cy.get('label[for="appointments-X778160-123456-enforcementAction"]').should('contain.text', 'Send a letter')
    cy.get('label[for="appointments-X778160-123456-enforcementAction-2"]').should('contain.text', 'Initiate a breach')
    cy.get('label[for="appointments-X778160-123456-enforcementAction-3"]').should(
      'contain.text',
      'Initiate a breach and send a letter',
    )
    cy.get('label[for="appointments-X778160-123456-enforcementAction-4"]').should('contain.text', 'No further action')
    cy.get('.govuk-radios__divider').should('contain.text', 'or')
    cy.get('label[for="appointments-X778160-123456-enforcementAction-6"]').should(
      'contain.text',
      'I want to add a different action',
    )
  })

  it('should have the correct back link', () => {
    attendedFailedToComplyPage.getBackLink().should('have.attr', 'href', `/case/${crn}/appointments`)
  })
})
