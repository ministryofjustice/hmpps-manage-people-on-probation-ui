import Page from '../pages/page'
import OverviewPage from '../pages/overview'

context('Final third eligibility prompt', () => {
  const CRN = 'X000001' // Caroline Wolff

const setFlags = (enableFinalThirdPrompt = true, enableSupervisionPackage = true) =>
  cy.task('stubFeatureFlags', [
    { key: 'enableFinalThirdPrompt', enabled: enableFinalThirdPrompt },
    { key: 'enableSupervisionPackage', enabled: enableSupervisionPackage },
  ])  
  const enableTierChangePrompt = (enabled = false) =>
    cy.task('stubFeatureFlag', { key: 'enableTierChangePrompt', enabled })
  const stubSupervisionPackage = (
    finalThirdEligibility?: { eligible: boolean; since: string } | null,
    status = 200,
  ) =>
    cy.task('stubSupervisionPackageFrontendContext', {
      crn: CRN,
      status,
      frontendContext: {
        currentPhase: {
          supervisionPackage: { code: 'STD', description: 'Standard' },
          phase: { code: 'STD', description: 'Standard supervision' },
          eventNumber: '1',
          startDate: '2024-01-01',
          endDate: '2025-01-01',
        },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        context: {
          name: { forename: 'Caroline', middleNames: '', surname: 'Wolff' },
          gender: 'Female',
          finalThirdEligibility,
        },
      },
    })
  const noOutcomes = () => cy.task('stubNoOverdueOutcomes')
  const singleOutcome = () => cy.task('stubSingleOverdueOutcome')
  const noTierHistory = () => cy.task('stubTierHistory', { crn: CRN, history: [] })

  const daysAgo = (n: number): string => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    const pad = (x: number) => String(x).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  const visit = () => {
    cy.visit(`/case/${CRN}`)
    return Page.verifyOnPage(OverviewPage)
  }

  beforeEach(() => {
    cy.task('resetMocks')
    enableTierChangePrompt(false)
    noOutcomes()
    noTierHistory()
  })

  it('AC: shows a Final Third prompt when eligible became true within the last 7 days', () => {
    setFlags()
    stubSupervisionPackage({ eligible: true, since: daysAgo(0) })
    const page = visit()

    page.notificationHeading().should('contain.text', 'Information that needs your attention')
    page.notificationBannerContent().should('contain.text', 'Caroline is eligible for the final third stage.')
  })

  it('AC: shows a Final Third prompt when eligible became false within the last 7 days', () => {
    setFlags()
    stubSupervisionPackage({ eligible: false, since: daysAgo(0) })
    const page = visit()

    page.notificationHeading().should('contain.text', 'Information that needs your attention')
    page.notificationBannerContent().should('contain.text', 'Caroline is not eligible for the final third stage.')
  })

  it('AC: no prompt when since is more than 6 calendar days before today', () => {
    setFlags()
    stubSupervisionPackage({ eligible: true, since: daysAgo(7) })
    const page = visit()

    page.pageHeading().should('contain.text', 'Overview')
    page.notificationBanner().should('not.exist')
  })

  it('window boundary: since exactly 6 days ago is still shown', () => {
    setFlags()
    stubSupervisionPackage({ eligible: true, since: daysAgo(6) })
    const page = visit()

    page.notificationBannerContent().should('contain.text', 'Caroline is eligible for the final third stage.')
  })

  it('AC: a Final Third prompt co-exists with an outcomes prompt, in priority order (outcomes first)', () => {
    setFlags()
    singleOutcome()
    stubSupervisionPackage({ eligible: true, since: daysAgo(0) })
    const page = visit()

    page.notificationItems().should('have.length', 2)
    page.notificationItems().eq(0).should('contain.text', 'record an outcome for 1 appointment')
    page.notificationItems().eq(1).should('contain.text', 'is eligible for the final third stage')
    page.outcomesPromptItem().should('exist')
    page.finalThirdPromptItem().should('exist')
  })

  it('AC: missing appointment outcomes, tier changes and Final Third all display together in priority order', () => {
    // Both custom flags must be set in one snapshot response: stubFeatureFlag rebuilds the
    // whole flags list from the static base fixture each call, so two separate calls for two
    // different keys would leave only the second key's flag in the response.
    cy.task('stubFeatureFlags', [
      { key: 'enableTierChangePrompt', enabled: true },
      { key: 'enableFinalThirdPrompt', enabled: true },
    ])
    singleOutcome()
    cy.task('stubTierHistory', {
      crn: CRN,
      history: [
        { tierScore: 'A1', calculationId: 'calc-1', calculationDate: `${daysAgo(0)}T10:00:00`, provisional: false },
        { tierScore: 'A2', calculationId: 'calc-2', calculationDate: `${daysAgo(60)}T10:00:00`, provisional: false },
      ],
    })
    stubSupervisionPackage({ eligible: false, since: daysAgo(0) })
    const page = visit()

    page.notificationItems().should('have.length', 3)
    page.notificationItems().eq(0).should('contain.text', 'record an outcome for 1 appointment')
    page.notificationItems().eq(1).should('contain.text', 'tier has changed from A2 to A1')
    page.notificationItems().eq(2).should('contain.text', 'is not eligible for the final third stage')
  })

  it('AC: the Final Third prompt is not a link', () => {
    setFlags()
    stubSupervisionPackage({ eligible: true, since: daysAgo(0) })
    const page = visit()

    page.notificationBannerContent().should('contain.text', 'is eligible for the final third stage')
    page.notificationBannerContent().find('a').should('not.exist')
  })

  it('AC: the prompt cannot be dismissed', () => {
    setFlags()
    stubSupervisionPackage({ eligible: true, since: daysAgo(0) })
    const page = visit()

    page.notificationBanner().should('exist')
    page.notificationBanner().find('button').should('not.exist')
  })

  it('with the flag off, no Final Third prompt appears', () => {
    setFlags(false)
    stubSupervisionPackage({ eligible: true, since: daysAgo(0) })
    const page = visit()

    page.pageHeading().should('contain.text', 'Overview')
    page.notificationBanner().should('not.exist')
  })

  it('is resilient when the current-phase endpoint errors: the page still renders without a Final Third prompt', () => {
    setFlags()
    singleOutcome()
    stubSupervisionPackage(null, 500)
    const page = visit()

    page.pageHeading().should('contain.text', 'Overview')
    page.notificationHeading().should('contain.text', 'Information that needs your attention')
    page.notificationBannerContent().should('not.contain.text', 'final third')
  })
})
