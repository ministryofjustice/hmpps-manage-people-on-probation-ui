import NoPermissions from '../../pages/personalDetails/noPermissions'
import Page from '../../pages/page'
import PersonalDetailsPage from '../../pages/personalDetails'

context('Edit contact details no permissions', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })

  it('accessing edit contact details, no permission page is rendered when 404 returned for roles', () => {
    checkPageTitle('stubNoRolesFound', '/case/X000001/personal-details/edit-contact-details')
  })

  it('accessing edit contact details, no permission page is rendered when role not present', () => {
    checkPageTitle('stubRoleNotPresent', '/case/X000001/personal-details/edit-contact-details')
  })

  it('accessing edit main address, no permission page is rendered when 404 returned for roles', () => {
    checkPageTitle('stubNoRolesFound', '/case/X000001/personal-details/edit-main-address')
  })

  it('accessing edit main address, no permission page is rendered when role not present', () => {
    checkPageTitle('stubRoleNotPresent', '/case/X000001/personal-details/edit-main-address')
  })

  it('personal details screen should not show change links when no roles found', () => {
    cy.task('stubNoRolesFound')
    checkEditLinks()
  })

  it('personal details screen should not show change links when role is not present', () => {
    cy.task('stubRoleNotPresent')
    checkEditLinks()
  })

  function checkPageTitle(role: string, url: string) {
    cy.task(role)
    cy.visit(url, { failOnStatusCode: false })
    const page = new NoPermissions()
    page.checkOnPage()
  }

  function checkEditLinks() {
    cy.visit('/case/X000001/personal-details')
    const page = Page.verifyOnPage(PersonalDetailsPage)
    page.getElementData('telephoneNumberAction').should('not.exist')
    page.getElementData('mobileNumberAction').should('not.exist')
    page.getElementData('emailAddressAction').should('not.exist')
    page.getElementData('mainAddressAction').should('not.exist')
  }
})
