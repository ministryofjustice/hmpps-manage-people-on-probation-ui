export const checkLogOutcomesAlert = (attendedComplied = false) => {
  it('should render the log outcomes alert banner', () => {
    cy.get('[data-module="serviceAlert"]').as('alert')
    cy.get('@alert')
      .get('.moj-alert__content')
      .should(
        'contain.text',
        !attendedComplied
          ? 'You can only use this service to log attended and complied outcomes.'
          : 'You can only log attended and complied outcomes. If you need to log a different outcome,',
      )
    cy.get('@alert')
      .get('.moj-alert__content a')
      .should(
        'contain.text',
        !attendedComplied
          ? 'Use NDelius to arrange an appointment in the past with another outcome'
          : 'arrange this appointment on NDelius',
      )
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=ContactList&CRN=X778160',
      )
      .should('have.attr', 'target', '_blank')
    cy.get('@alert').get('.moj-alert__action button').should('contain.text', 'Dismiss')
  })
}
