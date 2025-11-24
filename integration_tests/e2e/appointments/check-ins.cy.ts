import Page from '../../pages/page'
import AppointmentsPage from '../../pages/appointments'
import InstructionsPage from '../../pages/check-ins/instructions'
import DateFrequencyPage from '../../pages/check-ins/date-frequencey'
import { getCheckinUuid } from './imports'
import ContactPreferencePage from '../../pages/check-ins/contact-preference'
import PhotoOptionsPage from '../../pages/check-ins/photo-options'
import EditContactPreferencePage from '../../pages/check-ins/edit-contact-preference'
import ErrorPage from '../../pages/error'
import TakeAPhotoOptionsPage from '../../pages/check-ins/take-a-photo-options'
import UploadAPhotoPage from '../../pages/check-ins/upload-a-photo'

const loadPage = () => {
  cy.task('stubEnableESuperVision')
  cy.visit(`/case/X000001/appointments`)
}
context('Appointment check-ins', () => {
  it('Appointments page with online check-ins', () => {
    loadPage()
    const page = Page.verifyOnPage(AppointmentsPage)
    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Eula Schmeler')
    cy.get('[data-qa="appointments-header-label"]').should('contain.text', 'Appointments')
    page.getElement('[data-qa="upcomingAppointments"]').find('h2').should('contain.text', 'Upcoming appointments')
    page
      .getElement('[data-qa="online-checkin-btn"]')
      .should('be.visible')
      .and('contain.text', 'Set up online check ins')
    page.getElement('[data-qa="online-checkin-btn"]').click()
    cy.url().should('contain', '/case/X000001/appointments/check-in/instructions')
    const instructionsPage = new InstructionsPage()
    instructionsPage.checkOnPage()
    instructionsPage.getElement('[data-qa="formAnchorLink"]').click()
    Page.verifyOnPage(AppointmentsPage)
  })

  it('check-in frequency page should fail with validation errors', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const instructionsPage = new InstructionsPage()
    instructionsPage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    dateFrequencyPage.getSubmitBtn().click()
    dateFrequencyPage.checkErrorSummaryBox([
      'Select how often you would like the person to check in',
      'Enter the date you would like the person to complete their first check in',
    ])

    getCheckinUuid().then(uuid => {
      dateFrequencyPage.getElement(`#esupervision-X000001-${uuid}-checkins-date-error`).should($error => {
        expect($error.text().trim()).to.include(
          'Enter the date you would like the person to complete their first check in',
        )
      })
      dateFrequencyPage.getElement(`#esupervision-X000001-${uuid}-checkins-interval-error`).should($error => {
        expect($error.text().trim()).to.include('Select how often you would like the person to check in')
      })
    })
  })

  it('should able to submit check-in frequency details', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const instructionsPage = new InstructionsPage()
    instructionsPage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()

    dateFrequencyPage.getDatePickerToggle().click()
    dateFrequencyPage.getNextDayButton().click()
    dateFrequencyPage.getFrequency().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    dateFrequencyPage.getSubmitBtn().click()
    const contactPreferencePage = new ContactPreferencePage()
    contactPreferencePage.checkOnPage()
  })

  it('contact preference page should fail with validation errors', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const instructionsPage = new InstructionsPage()
    instructionsPage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.getDatePickerToggle().click()
    dateFrequencyPage.getNextDayButton().click()
    dateFrequencyPage.getFrequency().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    dateFrequencyPage.getSubmitBtn().click()
    const contactPreferencePage = new ContactPreferencePage()
    contactPreferencePage.checkOnPage()
    contactPreferencePage.getSubmitBtn().click()
    getCheckinUuid().then(uuid => {
      dateFrequencyPage.getElement(`#esupervision-X000001-${uuid}-checkins-preferredComs-error`).should($error => {
        expect($error.text().trim()).to.include('Select how the person wants us to send a link to the service')
      })
    })
  })

  it('should able to submit contact preference details', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const instructionsPage = new InstructionsPage()
    instructionsPage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.getDatePickerToggle().click()
    dateFrequencyPage.getNextDayButton().click()
    dateFrequencyPage.getFrequency().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    dateFrequencyPage.getSubmitBtn().click()
    const contactPreferencePage = new ContactPreferencePage()
    contactPreferencePage.checkOnPage()
    contactPreferencePage
      .getCheckInPreferredComs()
      .find('.govuk-radios__item')
      .eq(0)
      .find('.govuk-radios__input')
      .click()
    contactPreferencePage.getSubmitBtn().click()

    const photoOptionsPage = new PhotoOptionsPage()
    photoOptionsPage.checkOnPage()
  })

  it('should able to edit contact preference details', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const instructionsPage = new InstructionsPage()
    instructionsPage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.getDatePickerToggle().click()
    dateFrequencyPage.getNextDayButton().click()
    dateFrequencyPage.getFrequency().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    dateFrequencyPage.getSubmitBtn().click()
    const contactPreferencePage = new ContactPreferencePage()
    contactPreferencePage.checkOnPage()
    contactPreferencePage.getChangeLink().click()
    const editContactPreferencePage = new EditContactPreferencePage()
    editContactPreferencePage.checkOnPage()
    editContactPreferencePage.getSubmitBtn().click()
    contactPreferencePage.getElementData('updateBanner').should('contain.text', 'Contact details saved')
  })

  it('should show error page when update fails with 500 HTTP response code', () => {
    cy.task('stubUpdatePersonalContact500Response')
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const instructionsPage = new InstructionsPage()
    instructionsPage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.getDatePickerToggle().click()
    dateFrequencyPage.getNextDayButton().click()
    dateFrequencyPage.getFrequency().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    dateFrequencyPage.getSubmitBtn().click()
    const contactPreferencePage = new ContactPreferencePage()
    contactPreferencePage.checkOnPage()
    contactPreferencePage.getChangeLink().click()
    const editContactPreferencePage = new EditContactPreferencePage()
    editContactPreferencePage.checkOnPage()
    editContactPreferencePage.getSubmitBtn().click()
    const errorPage = new ErrorPage()
    errorPage.checkPageTitle('Sorry, there is a problem with the service')
  })

  it('should show error page when update fails with 404 HTTP response code', () => {
    cy.task('stubUpdatePersonalContact404Response')
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const instructionsPage = new InstructionsPage()
    instructionsPage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.getDatePickerToggle().click()
    dateFrequencyPage.getNextDayButton().click()
    dateFrequencyPage.getFrequency().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    dateFrequencyPage.getSubmitBtn().click()
    const contactPreferencePage = new ContactPreferencePage()
    contactPreferencePage.checkOnPage()
    contactPreferencePage.getChangeLink().click()
    const editContactPreferencePage = new EditContactPreferencePage()
    editContactPreferencePage.checkOnPage()
    editContactPreferencePage.getSubmitBtn().click()
    const errorPage = new ErrorPage()
    errorPage.checkPageTitle('Page not found')
  })

  it('Should able to choose photo options', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const instructionsPage = new InstructionsPage()
    instructionsPage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.getDatePickerToggle().click()
    dateFrequencyPage.getNextDayButton().click()
    dateFrequencyPage.getFrequency().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    dateFrequencyPage.getSubmitBtn().click()
    const contactPreferencePage = new ContactPreferencePage()
    contactPreferencePage.checkOnPage()
    contactPreferencePage
      .getCheckInPreferredComs()
      .find('.govuk-radios__item')
      .eq(0)
      .find('.govuk-radios__input')
      .click()
    contactPreferencePage.getSubmitBtn().click()
    const takeAPhotoOptionsPage = new TakeAPhotoOptionsPage()
    takeAPhotoOptionsPage.checkOnPage()
    takeAPhotoOptionsPage.getPhotoOptions().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    takeAPhotoOptionsPage.getSubmitBtn().click()
    takeAPhotoOptionsPage.getBackLink().click()
    takeAPhotoOptionsPage.checkOnPage()
    takeAPhotoOptionsPage.getPhotoOptions().find('.govuk-radios__item').eq(1).find('.govuk-radios__input').click()
    takeAPhotoOptionsPage.getSubmitBtn().click()
    const uploadablePhoto = new UploadAPhotoPage()
    uploadablePhoto.checkOnPage()
    uploadablePhoto.getBackLink().click()
    takeAPhotoOptionsPage.checkOnPage()
  })
})
