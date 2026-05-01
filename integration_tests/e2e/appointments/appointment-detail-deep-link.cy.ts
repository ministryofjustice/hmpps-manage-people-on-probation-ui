describe('Appointment detail - enableDeepLinks', () => {
  beforeEach(() => {
    cy.task('resetMocks')
    cy.task('stubEnableDeepLinks')
    cy.task('stubAppointmentDeepLinkWithOutcome')
    cy.visit('/case/X000001/activity/12')
  })

  it('should display the NDelius deep link paragraph when outcome is recorded', () => {
    cy.get('[data-qa="outcomeDetailsCard"]').should('exist')
    cy.contains('a', 'drug history in NDelius (opens in a new tab)')
      .should('have.attr', 'target', '_blank')
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=DrugHistory&CRN=X000001&EventNumber=7654321',
      )
  })
})
