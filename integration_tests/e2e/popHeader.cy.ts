context('PoP Header partial', () => {
  const CRN = 'X000001'

  beforeEach(() => {
    cy.task('resetMocks')
  })

  const enablePopHeaderWithTier = (tier: { tierScore: string; provisional?: boolean }) => {
    cy.task('stubFeatureFlags', [
      { key: 'enableSupervisionPackagePoPHeader', enabled: true },
      { key: 'enableSupervisionPackage', enabled: true },
    ])
    cy.task('stubTierDetails', { crn: CRN, ...tier })
  }

  it('shows the new popHeader component when enableSupervisionPackagePoPHeader is true', () => {
    cy.task('stubFeatureFlag', { key: 'enableSupervisionPackagePoPHeader', enabled: true })
    cy.visit('/case/X000001')

    cy.get('[data-qa="new-pop-header"]').should('exist').and('contain.text', 'X000001')
    cy.get('[data-qa="legacy-pop-header"]').should('not.exist')
  })

  it('renders the calculated tier score and no provisional tag when the tier is confirmed', () => {
    enablePopHeaderWithTier({ tierScore: 'B2', provisional: false })
    cy.visit('/case/X000001')

    cy.get('[data-qa="new-pop-header"] [data-qa="tierLink"]').should('contain.text', 'Tier: B2')
    cy.get('[data-qa="new-pop-header"] .govuk-tag').should('not.exist')
  })

  it('renders a provisional tag when the tier calculation is provisional', () => {
    enablePopHeaderWithTier({ tierScore: 'B2', provisional: true })
    cy.visit('/case/X000001')

    cy.get('[data-qa="new-pop-header"] [data-qa="tierLink"]').should('contain.text', 'Tier: B2')
    cy.get('[data-qa="new-pop-header"] .govuk-tag').should('exist').and('contain.text', 'Provisional')
  })

  it('renders a missing tag when the tier score is MISSING', () => {
    enablePopHeaderWithTier({ tierScore: 'MISSING', provisional: true })
    cy.visit('/case/X000001')

    cy.get('[data-qa="new-pop-header"] [data-qa="tierLink"]').should('contain.text', 'Tier: Missing')
    cy.get('[data-qa="new-pop-header"] .govuk-tag').should('exist').and('contain.text', 'Missing')
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
