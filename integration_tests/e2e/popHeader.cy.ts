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

  it('shows only the person header when enablePersonHeader is true', () => {
    cy.task('stubFeatureFlag', { key: 'enablePersonHeader', enabled: true })
    cy.visit('/case/X000001')

    cy.get('.person-header [data-qa="crn"]').should('exist').and('contain.text', 'X000001')
    cy.get('[data-qa="legacy-pop-header"]').should('not.exist')
    cy.get('[data-qa="new-pop-header"]').should('not.exist')
    cy.get('.moj-page-header-actions').should('not.exist')
  })

  it('shows only the legacy header and actions block when enablePersonHeader is false', () => {
    cy.task('stubFeatureFlag', { key: 'enablePersonHeader', enabled: false })
    cy.visit('/case/X000001')

    cy.get('[data-qa="legacy-pop-header"]').should('exist').and('contain.text', 'X000001')
    cy.get('.moj-page-header-actions').should('exist')
    cy.get('.person-header').should('not.exist')
  })
})
