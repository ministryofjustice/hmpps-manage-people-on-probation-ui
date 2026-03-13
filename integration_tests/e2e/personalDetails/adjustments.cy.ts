context('Contact', () => {
  it('Adjustments page is rendered', () => {
    cy.visit('/case/X000001/personal-details/adjustments')

    cy.get('p')
      .eq(1)
      .within(() =>
        cy
          .get('a')
          .invoke('attr', 'href')
          .should(
            'equal',
            'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=EqualityMonitoring&CRN=X000001',
          ),
      )
    cy.get('p')
      .eq(1)
      .within(() => cy.get('a').should('contain.text', 'Change adjustments on NDelius (opens in new tab)'))
  })
})
