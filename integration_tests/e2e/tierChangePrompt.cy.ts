import Page from '../pages/page'
import OverviewPage from '../pages/overview'

context('Tier change prompt', () => {
  const CRN = 'X000001' // Caroline Wolff
  const TIER_HISTORY_HREF = 'https://tier-dev.hmpps.service.justice.gov.uk/v3/case/X000001'

  const enablePrompt = (enabled = true) => cy.task('stubFeatureFlag', { key: 'enableTierChangePrompt', enabled })
  const stubHistory = (history: Array<{ tierScore: string; calculationDate: string }>, status = 200) =>
    cy.task('stubTierHistory', { crn: CRN, history, status })
  const noOutcomes = () => cy.task('stubNoOverdueOutcomes')
  const singleOutcome = () => cy.task('stubSingleOverdueOutcome')

  const daysAgo = (n: number): string => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    const pad = (x: number) => String(x).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T12:00:00`
  }

  const entry = (tierScore: string, calculationDate: string) => ({
    tierScore,
    calculationId: `calc-${tierScore}-${calculationDate}`,
    calculationDate,
    changeReason: 'The supervision status changed',
    provisional: false,
  })

  const visit = () => {
    cy.visit(`/case/${CRN}`)
    return Page.verifyOnPage(OverviewPage)
  }

  beforeEach(() => {
    cy.task('resetMocks')
  })

  it('AC: shows a tier change prompt when the tier changed within the last 7 days (previous + new tier)', () => {
    enablePrompt()
    noOutcomes()
    stubHistory([entry('A1', daysAgo(0)), entry('A2', daysAgo(60))])
    const page = visit()

    page.notificationHeading().should('contain.text', 'Information that needs your attention')
    page.tierChangePromptLink().should('exist').and('contain.text', 'tier has changed from A2 to A1')
    page.notificationBannerContent().should('contain.text', 'Caroline')
    // Only one item -> rendered as a single line, not a bulleted list item
    page.tierChangePromptItem().should('not.exist')
  })

  it('AC: the tier change prompt links to the person Tier History in the Tiering Service', () => {
    enablePrompt()
    noOutcomes()
    stubHistory([entry('A1', daysAgo(0)), entry('A2', daysAgo(60))])
    const page = visit()

    page.tierChangePromptLink().should('have.attr', 'href', TIER_HISTORY_HREF)
  })

  it('AC: no prompt when the tier was recalculated but the tier is unchanged', () => {
    enablePrompt()
    noOutcomes()
    stubHistory([entry('A2', daysAgo(0)), entry('A2', daysAgo(3)), entry('A2', daysAgo(60))])
    const page = visit()

    page.pageHeading().should('contain.text', 'Overview')
    page.notificationBanner().should('not.exist')
  })

  it('AC: when multiple tier changes occur within the window, only the most recent is displayed', () => {
    enablePrompt()
    noOutcomes()
    stubHistory([entry('A1', daysAgo(0)), entry('A2', daysAgo(2)), entry('A3', daysAgo(4)), entry('A3', daysAgo(60))])
    const page = visit()

    page.tierChangePromptLink().should('contain.text', 'from A2 to A1')
    page.notificationBannerContent().should('not.contain.text', 'A3')
  })

  it('AC: no prompt when the tier change is older than the 7-day window', () => {
    enablePrompt()
    noOutcomes()
    stubHistory([entry('A1', daysAgo(10)), entry('A2', daysAgo(60))])
    const page = visit()

    page.pageHeading().should('contain.text', 'Overview')
    page.notificationBanner().should('not.exist')
  })

  it('AC: a tier change prompt and an outcomes prompt are both shown as bulleted items in priority order (outcomes first)', () => {
    enablePrompt()
    singleOutcome()
    stubHistory([entry('A1', daysAgo(0)), entry('A2', daysAgo(60))])
    const page = visit()

    page.notificationItems().should('have.length', 2)
    page.notificationItems().eq(0).should('contain.text', 'record an outcome for 1 appointment')
    page.notificationItems().eq(1).should('contain.text', 'tier has changed from A2 to A1')
    page.outcomesPromptItem().should('exist')
    page.tierChangePromptItem().should('exist')
    page.tierChangePromptItem().find('a[data-qa="tierChangePromptLink"]').should('exist')
    cy.get('.govuk-notification-banner__content ul').should('have.class', 'govuk-list--bullet')
  })

  it('AC: the prompt cannot be dismissed', () => {
    enablePrompt()
    noOutcomes()
    stubHistory([entry('A1', daysAgo(0)), entry('A2', daysAgo(60))])
    const page = visit()

    page.notificationBanner().should('exist')
    page.notificationBanner().find('button').should('not.exist')
  })

  it('AC: with the flag off, the original appointments banner is shown and no tier prompt appears', () => {
    enablePrompt(false)
    stubHistory([entry('A1', daysAgo(0)), entry('A2', daysAgo(60))])
    const page = visit()

    page.notificationHeading().should('contain.text', 'You have appointments that need attention')
    page.notificationBannerContent().should('not.contain.text', 'Information that needs your attention')
    page.tierChangePromptLink().should('not.exist')
  })

  it('shows a change into MISSING as a raw tier code (A2 to MISSING)', () => {
    enablePrompt()
    noOutcomes()
    stubHistory([entry('MISSING', daysAgo(0)), entry('A2', daysAgo(60))])
    const page = visit()

    page.tierChangePromptLink().should('contain.text', 'from A2 to MISSING')
  })

  it('shows a change out of MISSING as a raw tier code (MISSING to A2)', () => {
    enablePrompt()
    noOutcomes()
    stubHistory([entry('A2', daysAgo(0)), entry('MISSING', daysAgo(60))])
    const page = visit()

    page.tierChangePromptLink().should('contain.text', 'from MISSING to A2')
  })

  it('window boundary: a change exactly 6 days ago is still shown', () => {
    enablePrompt()
    noOutcomes()
    stubHistory([entry('A1', daysAgo(6)), entry('A2', daysAgo(60))])
    const page = visit()

    page.tierChangePromptLink().should('exist').and('contain.text', 'from A2 to A1')
  })

  it('window boundary: a change 7 days ago is no longer shown', () => {
    enablePrompt()
    noOutcomes()
    stubHistory([entry('A1', daysAgo(7)), entry('A2', daysAgo(60))])
    const page = visit()

    page.pageHeading().should('contain.text', 'Overview')
    page.notificationBanner().should('not.exist')
  })

  it('is resilient when the tier history endpoint errors: the page still renders without a tier prompt', () => {
    enablePrompt()
    stubHistory([], 500)
    const page = visit()

    page.pageHeading().should('contain.text', 'Overview')
    page.tierChangePromptLink().should('not.exist')
    page.notificationHeading().should('contain.text', 'Information that needs your attention')
    page.getAppointmentsLink(CRN).should('exist')
  })
})
