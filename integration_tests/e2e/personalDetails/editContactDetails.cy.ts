import AppointmentNotePage from '../../pages/appointments/note.page'
import TextMessageConfirmationPage from '../../pages/appointments/text-message-confirmation.page'
import Page from '../../pages/page'
import EditContactDetails from '../../pages/personalDetails/editContactDetails'
import {
  uuid,
  completeSentencePage,
  completeTypePage,
  completeLocationDateTimePage,
  completeTextMessageConfirmationPage,
  normalise,
} from '../appointments/imports'

const submitInvalidPhoneNumber = (page: EditContactDetails, field: string) => {
  page.getElementInput(field).clear().type('1-2345X')
  page.getElement('submitBtn').click()
}

context('Edit contact details', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('Edit contact details page is rendered based on non fixed address', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = new EditContactDetails()
    page.checkPageTitle('Edit contact details for Caroline')
    page.getElement('phoneNumber').should('be.visible')
    cy.get('.govuk-breadcrumbs').should('exist')
    page.getBackLink().should('not.exist')
    page.getElement('phoneNumber').find('label').should('contain.text', 'Phone number')
    page.getElement('phoneNumber').find('.govuk-hint').should('contain.text', 'For example, 01632 960 000')
    page.getElement('phoneNumber').find('input').should('have.value', '0123456999')
    page.getElement('mobileNumber').should('be.visible')
    cy.get('label[for=mobileNumber]').then($el => {
      expect(normalise($el.text())).to.eq('Mobile number (optional)')
    })
    page.getElement('mobileNumber').find('label').should('contain.text', 'Mobile number')
    page.getElement('mobileNumber').find('.govuk-hint').should('contain.text', 'For example, 07771 900 900')
    page.getElement('mobileNumber').find('input').should('have.value', '07783889300')
    page.getElement('emailAddress').should('be.visible')
    page.getElement('emailAddress').find('label').should('contain.text', 'Email address')
    page.getElement('emailAddress').find('.govuk-hint').should('contain.text', 'For example, name@example.com')
    page.getElement('emailAddress').find('input').should('have.value', 'address1@gmail.com')
    page.getElement('submitBtn').should('contain.text', 'Save changes')
    page
      .getElement('cancelBtn')
      .should('contain.text', 'Cancel and go back')
      .should('have.attr', 'href', '/case/X000001/personal-details')
  })
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
  it('Submitting a non-numeric mobile number should show error messages', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = new EditContactDetails()
    const expectedError = 'Enter a mobile number in the correct format.'
    submitInvalidPhoneNumber(page, 'mobileNumber')
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

  it('Submitting a valid email address over 254 chars should show error messages', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = new EditContactDetails()
    const s = 's'
    const maxCharLimit = s.repeat(260)
    const emailAddress = `${maxCharLimit}@gmail.com`
    page.getElementInput('emailAddress').clear().type(emailAddress)
    page.getElement('submitBtn').click()
    const expectedError = 'Email address must be 254 characters or less.'
    page.getErrorSummaryLink(0).should('contain.text', expectedError)
    page.getElement('emailAddressError').should('be.visible').should('contain.text', expectedError)
  })
  it('Submitting phone number, mobile number and email address with no values should post successfully', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = Page.verifyOnPage(EditContactDetails)
    page.getElementInput('phoneNumber').clear()
    page.getElementInput('mobileNumber').clear()
    page.getElementInput('emailAddress').clear()
    page.getElement('submitBtn').click()
    page.getElement('updateBanner').should('contain.text', 'Contact details saved')
  })
  it('Submitting successfully should redirect to Personal details screen with update banner', () => {
    cy.visit('/case/X000001/personal-details/edit-contact-details')
    const page = Page.verifyOnPage(EditContactDetails)
    page.getElement('submitBtn').click()
    page.getElement('updateBanner').should('contain.text', 'Contact details saved')
  })
})
context('Appointment journey', () => {
  let textMessageConfirmPage: TextMessageConfirmationPage
  let supportingInfoPage: AppointmentNotePage
  const crn = 'X000001'
  const loadPage = () => {
    cy.visit(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
    completeSentencePage(1, '', crn)
    completeTypePage()
    completeLocationDateTimePage({ crnOverride: crn })
    completeTextMessageConfirmationPage({ _crn: crn })
  }
  beforeEach(() => {
    loadPage()
  })
  it('should display the back link', () => {
    const page = Page.verifyOnPage(EditContactDetails)
    cy.get('.govuk-breadcrumbs').should('not.exist')
    page.getBackLink().click()
    textMessageConfirmPage = new TextMessageConfirmationPage()
    textMessageConfirmPage.checkOnPage()
  })
  it('should return to the text message confirmation page when Cancel and go back is clicked', () => {
    cy.get('[data-qa=cancelBtn]').click()
    textMessageConfirmPage = new TextMessageConfirmationPage()
    textMessageConfirmPage.checkOnPage()
  })
  it('should display only the mobile number field as mandatory', () => {
    const page = Page.verifyOnPage(EditContactDetails)
    cy.get('label[for=mobileNumber]').then($el => {
      expect(normalise($el.text())).to.eq('Mobile number')
    })
    page.getElementInput('phoneNumber').should('not.exist')
    page.getElementInput('emailAddress').should('not.exist')
    page.getElementInput('mobileNumber').should('have.value', '07783889300')
  })
  it('should display the validation summary and message if continue clicked without entering a mobile number', () => {
    const page = Page.verifyOnPage(EditContactDetails)
    page.getElementInput('mobileNumber').clear()
    cy.get('[data-qa=submitBtn]').click()
    page.checkErrorSummaryBox(['Enter a mobile number in the correct format.'])
    cy.get(`#mobileNumber-error`).should('contain.text', 'Enter a mobile number in the correct format.')
    page.getElementInput('phoneNumber').should('not.exist')
    page.getElementInput('emailAddress').should('not.exist')
    page.getElementInput('mobileNumber').should('not.have.value')
  })
  it('should redirect to the supporting information page if valid mobile number submitted', () => {
    const page = Page.verifyOnPage(EditContactDetails)
    page.getElementInput('mobileNumber').clear().type('07700900000')
    cy.get('[data-qa=submitBtn]').click()
    supportingInfoPage = new AppointmentNotePage()
    supportingInfoPage.checkOnPage()
  })
})
