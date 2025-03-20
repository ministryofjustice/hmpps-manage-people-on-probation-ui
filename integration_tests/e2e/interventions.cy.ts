import Page from '../pages/page'
import InterventionsPage from '../pages/interventions'

context('Interventions', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })
  it('Interventions page is rendered', () => {
    cy.visit('/case/X000001/interventions')
    const page = Page.verifyOnPage(InterventionsPage)
    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Eula Schmeler')
    page.pageHeading().should('contain.text', 'Interventions')

    page.assertRiskTags()
    page.getRowData('interventions', 'referralReferenceNumber3', 'Value').should('contain.text', 'AB2495DC')
    page
      .getRowData('interventions', 'referralInterventionTitle3', 'Value')
      .should('contain.text', 'Other Services - North West')
    cy.get('[data-qa="referral3Link"]')
      .should('contain.text', 'View')
      .should('have.attr', 'aria-label', `View referral AB2495DC for Other Services - North West`)
      .should('have.attr', 'target', '_blank')
      .should(
        'have.attr',
        'href',
        'https://hmpps-interventions-ui-dev.apps.live-1.cloud-platform.service.justice.gov.uk/probation-practitioner/referrals/5698c84b-4c0d-442f-84b6-27cd35eefca5/progress',
      )
    page
      .getRowData('interventions', 'referralInterventionTitle1', 'Value')
      .should('contain.text', 'Accommodation Services - North East')
    page.getRowData('interventions', 'referralReferenceNumber1', 'Value').should('contain.text', 'AC2495AC')
  })

  it('Interventions page is rendered with no results', () => {
    cy.task('stubNoInterventions')
    cy.visit('/case/X000001/interventions')
    cy.get('h2').should('contain.text', 'Interventions')
    cy.get('p').should('contain.text', 'There may be interventions in place but we cannot yet display them.')
    cy.get('p')
      .find('a')
      .should('contain.text', 'Search the contact log on NDelius (opens in new tab)')
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=ContactList&CRN=X000001',
      )
      .should('have.attr', 'target', '_blank')
  })
})
