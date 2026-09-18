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

  // Known gap: pop-header.njk only shows a tag when provisional is true, but the API can
  // return MISSING with provisional: false. Asserting the current behaviour here so a fix
  // shows up as an intentional test change rather than an untracked regression.
  it('shows the tier score but no tag for a MISSING tier score when provisional is false', () => {
    enablePopHeaderWithTier({ tierScore: 'MISSING', provisional: false })
    cy.visit('/case/X000001')

    cy.get('[data-qa="new-pop-header"] [data-qa="tierLink"]').should('contain.text', 'Tier: Missing')
    cy.get('[data-qa="new-pop-header"] .govuk-tag').should('not.exist')
  })

  // Known gap: same as above but for the Unavailable tag returned when the calculation can't
  // be found (404) - the API/library always reports provisional: false in this case.
  it('shows no tag when the tier calculation cannot be found', () => {
    cy.task('stubFeatureFlags', [
      { key: 'enableSupervisionPackagePoPHeader', enabled: true },
      { key: 'enableSupervisionPackage', enabled: true },
    ])
    cy.task('stubTierDetails', { crn: CRN, tierScore: '', status: 404 })
    cy.visit('/case/X000001')

    cy.get('[data-qa="new-pop-header"] .govuk-tag').should('not.exist')
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
