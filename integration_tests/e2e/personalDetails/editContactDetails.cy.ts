import { toCamelCase } from '../../../server/utils/utils'
import Page from '../../pages/page'
import EditContactDetails from '../../pages/personalDetails/editContactDetails'

const submitInvalidPhoneNumber = (page: EditContactDetails, field: string) => {
  page.getElementInput(field).clear().type('1-2345X')
  page.getElement('submitBtn').click()
}

const submitInvalidCharLength = (page: EditContactDetails, field: string) => {
  page.getElementInput(field).clear().type('1'.repeat(36))
  page.getElement('submitBtn').click()
}

context('Edit contact details', () => {
  it('Edit contact details page is rendered based on non fixed address', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = new EditContactDetails()
    page.setPageTitle('Edit contact details for Caroline')
    page.getElement('phoneNumber').should('be.visible')
    page.getElement('phoneNumber').find('label').should('contain.text', 'Phone number')
    page.getElement('phoneNumber').find('.govuk-hint').should('contain.text', 'For example, 01632 960 000')
    page.getElement('phoneNumber').find('input').should('have.value', '0123456999')
    page.getElement('mobileNumber').should('be.visible')
    page.getElement('mobileNumber').find('label').should('contain.text', 'Mobile number')
    page.getElement('mobileNumber').find('.govuk-hint').should('contain.text', 'For example, 07771 900 900')
    page.getElement('mobileNumber').find('input').should('have.value', '071838893')
    page.getElement('emailAddress').should('be.visible')
    page.getElement('emailAddress').find('label').should('contain.text', 'Email address')
    page.getElement('emailAddress').find('.govuk-hint').should('contain.text', 'For example, name@example.com')
    page.getElement('emailAddress').find('input').should('have.value', 'address1@gmail.com')
    page.getElement('submitBtn').should('contain.text', 'Save changes')
    page
      .getElement('cancelBtn')
      .should('contain.text', 'Cancel')
      .should('have.attr', 'href', '/case/X000001/personal-details')
  })

  const mandatoryFields = [
    ['phone number', 'Enter a phone number.'],
    ['mobile number', 'Enter a mobile number.'],
    ['email address', 'Enter an email address.'],
  ]

  for (const field of mandatoryFields) {
    it(`Submitting with no ${field[0]} should show error messages`, () => {
      cy.visit('/case/X000001/personal-details/edit-contact-details')
      const page = Page.verifyOnPage(EditContactDetails)
      page.getElementInput(toCamelCase(field[0])).clear()
      page.getElement('submitBtn').click()
      page.getErrorSummaryLink(0).should('contain.text', field[1])
    })
  }

  it('Submitting a non-numeric phone number should show error messages', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = new EditContactDetails()
    submitInvalidPhoneNumber(page, 'phoneNumber')
    page.getErrorSummaryLink(0).should('contain.text', 'Enter a phone number in the correct format.')
    page
      .getElement('phoneNumberError')
      .should('be.visible')
      .should('contain.text', 'Enter a phone number in the correct format.')
  })
  it('Clicking the error summary link should focus the phone number field', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = new EditContactDetails()
    submitInvalidPhoneNumber(page, 'phoneNumber')
    page.getErrorSummaryLink(0).click()
    page.getElementInput('phoneNumber').should('be.focused')
  })

  it('Submitting a phone number over 35 chars should show error messages', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = new EditContactDetails()
    const expectedError = 'Phone number must be 35 characters or less.'
    submitInvalidCharLength(page, 'phoneNumber')
    page.getErrorSummaryLink(0).should('contain.text', expectedError)
    page.getElement('phoneNumberError').should('be.visible').should('contain.text', expectedError)
  })

  it('Submitting a non-numeric mobile number should show error messages', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = new EditContactDetails()
    const expectedError = 'Enter a mobile number in the correct format.'
    submitInvalidPhoneNumber(page, 'mobileNumber')
    page.getErrorSummaryLink(0).should('contain.text', expectedError)
    page.getElement('mobileNumberError').should('be.visible').should('contain.text', expectedError)
  })

  it('Submitting a mobile number over 35 chars should show error messages', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = new EditContactDetails()
    const expectedError = 'Mobile number must be 35 characters or less.'
    submitInvalidCharLength(page, 'mobileNumber')
    page.getErrorSummaryLink(0).should('contain.text', expectedError)
    page.getElement('mobileNumberError').should('be.visible').should('contain.text', expectedError)
  })

  it('Submitting an invalid email address should show error messages', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = new EditContactDetails()
    page.getElementInput('emailAddress').clear().type('notvalid@@gmail..com')
    page.getElement('submitBtn').click()
    const expectedError = 'Enter an email address in the correct format.'
    page.getErrorSummaryLink(0).should('contain.text', expectedError)
    page.getElement('emailAddressError').should('be.visible').should('contain.text', expectedError)
  })

  it('Submitting a valid email address over 35 chars should show error messages', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = new EditContactDetails()
    page.getElementInput('emailAddress').clear().type('address11111111111111111111111@gmail.com')
    page.getElement('submitBtn').click()
    const expectedError = 'Email address must be 35 characters or less.'
    page.getErrorSummaryLink(0).should('contain.text', expectedError)
    page.getElement('emailAddressError').should('be.visible').should('contain.text', expectedError)
  })

  it('Submitting successfully should redirect to Personal details screen with update banner', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = Page.verifyOnPage(EditContactDetails)
    page.getElement('submitBtn').click()
    page.getElement('updateBanner').should('contain.text', 'Contact details saved')
  })
})
