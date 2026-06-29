context('PoP Header partial', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })

  it('shows the new popHeader component when enableSupervisionPackagePoPHeader is true', () => {
    cy.task('stubFeatureFlag', { key: 'enableSupervisionPackagePoPHeader', enabled: true })
    cy.visit('/case/X000001')

    cy.get('[data-qa="new-pop-header"]').should('exist').and('contain.text', 'X000001')
    cy.get('[data-qa="legacy-pop-header"]').should('not.exist')
  })

  it('shows the legacy header when enableSupervisionPackagePoPHeader is false', () => {
    cy.task('stubFeatureFlag', { key: 'enableSupervisionPackagePoPHeader', enabled: false })
    cy.visit('/case/X000001')

    cy.get('[data-qa="legacy-pop-header"]').should('exist').and('contain.text', 'X000001')
    cy.get('[data-qa="new-pop-header"]').should('not.exist')
  })
})
