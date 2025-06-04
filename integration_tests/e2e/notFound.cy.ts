import NotFoundPage from '../pages/notFound'

context('Invalid crn in url', () => {
  it('Overview should render the 404 error page if CRN does not exist', () => {
    cy.visit('/case/XXXXXXX', { failOnStatusCode: false })
    const page = new NotFoundPage()
    page.setPageTitle('Page not found')
  })
  it('Appointments should render the 404 error page if CRN does not exist', () => {
    cy.visit('/case/XXXXXXX/appointments', { failOnStatusCode: false })
    const page = new NotFoundPage()
    page.setPageTitle('Page not found')
  })
  it('Personal details should render the 404 error page if CRN does not exist', () => {
    cy.visit('/case/XXXXXXX/personal-details', { failOnStatusCode: false })
    const page = new NotFoundPage()
    page.setPageTitle('Page not found')
  })
  it('Documents should render the 404 error page if CRN does not exist', () => {
    cy.visit('/case/XXXXXXX/documents', { failOnStatusCode: false })
    const page = new NotFoundPage()
    page.setPageTitle('Page not found')
  })
  it('Risk page should render the 404 error page if CRN does not exist', () => {
    cy.visit('/case/XXXXXXX/risk', { failOnStatusCode: false })
    const page = new NotFoundPage()
    page.setPageTitle('Page not found')
  })
  it('Sentence page should render the 404 error page if CRN does not exist', () => {
    cy.visit('/case/XXXXXXX/sentence', { failOnStatusCode: false })
    const page = new NotFoundPage()
    page.setPageTitle('Page not found')
  })
  it('Activity log page should render the 404 error page if CRN does not exist', () => {
    cy.visit('/case/XXXXXXX/activity-log', { failOnStatusCode: false })
    const page = new NotFoundPage()
    page.setPageTitle('Page not found')
  })
  it('Compliance log page should render the 404 error page if CRN does not exist', () => {
    cy.visit('/case/XXXXXXX/compliance', { failOnStatusCode: false })
    const page = new NotFoundPage()
    page.setPageTitle('Page not found')
  })
})
