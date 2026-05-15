import EnforcementActionsPage from '../../pages/enforcementActions'

context('Enforcement actions', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })

  it('should render the enforcement actions page', () => {
    cy.visit('/caseload/appointments/enforcement-actions')
    const page = new EnforcementActionsPage()

    page.checkPageTitle('My enforcement actions')
    page.getTableColumnHeading(0).should('contain.text', 'Name / CRN')
    page.getTableColumnHeading(1).should('contain.text', 'Appointment details')
    page.getTableColumnHeading(2).should('contain.text', 'Appointment outcome')
    page.getTableColumnHeading(3).should('contain.text', 'Enforcement action')
    page.getTableColumnHeading(4).should('contain.text', 'Action')

    page
      .getTableCell(1, 1)
      .find('a')
      .should('contain.text', 'Emard, Garrett')
      .should('have.attr', 'href', '/case/X000001')
    page
      .getTableCell(1, 2)
      .find('a')
      .should('contain.text', 'Planned office visit')
      .should(
        'have.attr',
        'href',
        '/case/X000001/appointments/appointment/1/manage?back=/caseload/appointments/enforcement-actions',
      )
    page.getTableCell(1, 3).should('contain.text', 'Unacceptable absence')
    page.getTableCell(1, 4).should('contain.text', 'Breach initiated')
    page.getTableCell(1, 5).find('a').should('contain.text', 'Manage on NDelius')

    page
      .getTableCell(2, 1)
      .find('a')
      .should('contain.text', 'Bradtke, Ethan')
      .should('have.attr', 'href', '/case/X000001')
    page
      .getTableCell(2, 2)
      .find('a')
      .should('contain.text', 'Home Visit')
      .should(
        'have.attr',
        'href',
        '/case/X000001/appointments/appointment/4/manage?back=/caseload/appointments/enforcement-actions',
      )
    page.getTableCell(2, 3).should('contain.text', 'Failed to attend')
    page.getTableCell(2, 4).should('contain.text', 'Warning letter issued')
    page.getTableCell(2, 5).find('a').should('contain.text', 'Manage')
  })

  it('should navigate using the pagination next button', () => {
    cy.visit('/caseload/appointments/enforcement-actions')
    const page = new EnforcementActionsPage()

    page.checkPageTitle('My enforcement actions')

    page.getPaginationItem(1).should('have.class', 'govuk-pagination__item--current')

    page.getNextPage().click()

    page.getPaginationItem(2).should('have.class', 'govuk-pagination__item--current')
  })

  it('should navigate using the pagination previous button', () => {
    cy.visit('/caseload/appointments/enforcement-actions')
    const page = new EnforcementActionsPage()

    page.checkPageTitle('My enforcement actions')
    page.getPaginationItem(1).should('have.class', 'govuk-pagination__item--current')

    page.getNextPage().click()
    page.getPaginationItem(2).should('have.class', 'govuk-pagination__item--current')

    page.getPreviousPage().click()
    page.getPaginationItem(1).should('have.class', 'govuk-pagination__item--current')
  })

  it('should navigate clicking on a page number in the pagination', () => {
    cy.visit('/caseload/appointments/enforcement-actions')
    const page = new EnforcementActionsPage()

    page.checkPageTitle('My enforcement actions')
    page.getPaginationItem(1).should('have.class', 'govuk-pagination__item--current')

    page.getPaginationItem(2).click()
    page.getPaginationItem(2).should('have.class', 'govuk-pagination__item--current')
  })

  it('should navigate back to the homepage page when clicking the back link', () => {
    cy.visit('/caseload/appointments/enforcement-actions')
    const page = new EnforcementActionsPage()

    page.checkPageTitle('My enforcement actions')
    page.getBackButton().click()
    cy.url().should('include', '/')
  })

  it('should navigate to the case page when clicking on the name link', () => {
    cy.visit('/caseload/appointments/enforcement-actions')
    const page = new EnforcementActionsPage()

    page.checkPageTitle('My enforcement actions')

    page.getTableCell(1, 1).find('a').click()
    cy.url().should('include', '/case/X000001')
  })

  it('should navigate to the appointment management page when clicking on the appointment details link', () => {
    cy.visit('/caseload/appointments/enforcement-actions')
    const page = new EnforcementActionsPage()

    page.checkPageTitle('My enforcement actions')
    page.getTableCell(1, 2).find('a').click()
    cy.url().should('include', '/case/X000001/appointments/appointment/1/manage')
  })

  it('should navigate to NDelius when clicking on the manage on NDelius link', () => {
    cy.visit('/caseload/appointments/enforcement-actions')
    const page = new EnforcementActionsPage()

    page.checkPageTitle('My enforcement actions')

    const ndeliusUrl =
      'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X000001&contactID=1'

    page.getTableCell(1, 5).find('a').should('have.attr', 'href', ndeliusUrl)

    page
      .getTableCell(1, 5)
      .find('a')
      .then($link => {
        expect($link.attr('href')).to.equal(ndeliusUrl)
      })
  })

  it('should navigate to appointment details when clicking on the manage link', () => {
    cy.visit('/caseload/appointments/enforcement-actions')
    const page = new EnforcementActionsPage()

    page.checkPageTitle('My enforcement actions')

    page.getTableCell(2, 5).find('a').click()
    cy.url().should(
      'include',
      '/case/X000001/appointments/appointment/4/manage?back=/caseload/appointments/enforcement-actions',
    )
  })

  it('should render the page with a message saying there are no results', () => {
    cy.task('stubNoEnforcementActions')
    cy.visit('/caseload/appointments/enforcement-actions')
    const page = new EnforcementActionsPage()

    page.checkPageTitle('My enforcement actions')
    cy.get('p').should('contain.text', 'There are no enforcement actions to take.')
    cy.get('table').should('not.exist')
    cy.get('.govuk-pagination').should('not.exist')
  })
})
