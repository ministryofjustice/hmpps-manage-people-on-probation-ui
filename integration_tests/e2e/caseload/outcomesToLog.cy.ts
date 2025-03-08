import UserAppointments from '../../pages/userAppointments'

context('Outcomes to log', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })
  it('Outcomes to log page is rendered', () => {
    cy.visit('/caseload/appointments/no-outcome')
    const page = new UserAppointments()
    page.setPageTitle('Outcomes to log')
    page.getTableColumnHeading(0).should('contain.text', 'Name / CRN')
    page.getTableColumnHeading(0).find('button').should('exist')
    page.getTableColumnHeading(1).should('contain.text', 'DOB / Age')
    page.getTableColumnHeading(1).find('button').should('exist')
    page.getTableColumnHeading(2).should('contain.text', 'Sentence')
    page.getTableColumnHeading(2).find('button').should('exist')
    page.getTableColumnHeading(3).should('contain.text', 'Date and time')
    page.getTableColumnHeading(3).find('button').should('exist')
    page.getTableColumnHeading(4).should('contain.text', 'Action')
    page.getTableColumnHeading(4).find('button').should('not.exist')
    page
      .getTableCell(1, 1)
      .find('a')
      .should('contain.text', 'Berge, Alton')
      .should('have.attr', 'href', '/case/X778160')
    page.getTableCell(1, 1).find('span').should('contain.text', 'X778160')
    page.getTableCell(1, 2).should('contain.text', '25 September 1975')
    page.getTableCell(1, 2).find('span').should('contain.text', 'Age 50')
    page.getTableCell(1, 3).should('contain.text', 'Adult Custody < 12m')
    page
      .getTableCell(1, 3)
      .find('a')
      .should('contain.text', '+ 3 more')
      .should('have.attr', 'href', '/case/X778160/sentence')
    page.getTableCell(1, 4).should('contain.text', '27 March 2025').should('contain.text', '9:30am to 10:30am')
    page
      .getTableCell(1, 5)
      .find('a')
      .should('contain.text', 'Log an outcome')
      .should('have.attr', 'target', '_blank')
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=1',
      )
    cy.get('.govuk-pagination').should('exist')
    page
      .getPaginationItem(1)
      .find('a')
      .should('contain.text', '1')
      .should('have.attr', 'href', '/caseload/appointments/no-outcome?page=0')
      .should('have.attr', 'aria-current', 'page')
  })

  it('Outcomes to log page is rendered with no results', () => {
    cy.task('stubNoOutcomesToLog')
    cy.visit('/caseload/appointments/no-outcome')
    const page = new UserAppointments()
    page.setPageTitle('Outcomes to log')
    cy.get('p').should('contain.text', 'No outcomes to log.')
    cy.get('table').should('not.exist')
    cy.get('.govuk-pagination').should('not.exist')
  })
})
