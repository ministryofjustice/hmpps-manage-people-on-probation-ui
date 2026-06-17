import { DateTime } from 'luxon'
import Page from '../../pages/page'
import AppointmentsPage from '../../pages/appointments'
import DateFrequencyPage from '../../pages/check-ins/date-frequencey'
import ContactPreferencePage from '../../pages/check-ins/contact-preference'
import PhotoOptionsPage from '../../pages/check-ins/photo-options'
import EditContactPreferencePage from '../../pages/check-ins/edit-contact-preference'
import ErrorPage from '../../pages/error'
import TakeAPhotoOptionsPage from '../../pages/check-ins/take-a-photo-options'
import UploadAPhotoPage from '../../pages/check-ins/upload-a-photo'
import PhotoRulesPage from '../../pages/check-ins/photo-rules'
import CheckYourAnswersPage from '../../pages/check-ins/check-your-answers'
import CheckinConfirmationPage from '../../pages/check-ins/confirmation.page'
import TakeAPhotoPage from '../../pages/check-ins/take-a-photo'
import OverviewPage from '../../pages/overview'
import ManageCheckins from '../../pages/check-ins/manage-checkins'
import ManageContactPage from '../../pages/check-ins/manage-contact'
import ManageEditContactPage from '../../pages/check-ins/manage-edit-contact'
import ChangeSettingsPage from '../../pages/check-ins/change-settings'
import StopCheckins from '../../pages/check-ins/stop-checkins'
import RestartConfirmationPage from '../../pages/check-ins/restart/restart-confirmation.page'
import RestartContactPreferencePage from '../../pages/check-ins/restart/restart-contact-preference.page'
import RestartDateFrequencyPage from '../../pages/check-ins/restart/restart-date-frequency.page'
import RestartCheckYourAnswersPage from '../../pages/check-ins/restart/restart-check-your-answers.page'
import RestartEditContactPreferencePage from '../../pages/check-ins/restart/restart-edit-contact-preference.page'
import EligibilityCheckPage from '../../pages/check-ins/eligibility-check'
import EligibilityFullPage from '../../pages/check-ins/eligibility-full'
import EligibilitySupplementaryPage from '../../pages/check-ins/eligibility-supplementary'
import EligibilityDeniedPage from '../../pages/check-ins/eligibility-denied'
import { getCheckinUuid } from './utils'
import AddQuestionsPage from '../../pages/check-ins/questions/add-questions'
import InstructionsPage from '../../pages/check-ins/questions/instructions'
import PreviewFeelingPage from '../../pages/check-ins/questions/preview/feeling'
import PreviewSupportPage from '../../pages/check-ins/questions/preview/support'
import EditQuestionPage from '../../pages/check-ins/questions/edit-question'
import ListQuestionsPage from '../../pages/check-ins/questions/list-questions'
import EligibilitySPOApprovalPage from '../../pages/check-ins/eligibility-spo-approval'
import RationalePage from '../../pages/check-ins/rationale'

const loadPage = () => {
  cy.task('resetMocks')
  cy.visit(`/case/X000001/appointments`)
  cy.task('stubGetQuestionsTemplates')
}

const clickNextDayButton = () => {
  const now = DateTime.now()
  const tomorrow = now.plus({ days: 1 })
  if (tomorrow.month !== now.month) {
    cy.get('.moj-js-datepicker-next-month').click()
  }
  cy.get(`[data-testid="${tomorrow.toFormat('d/M/yyyy')}"]`).click()
}

context('Appointment check-ins', () => {
  it('Appointments page with online check-ins', () => {
    loadPage()
    const page = Page.verifyOnPage(AppointmentsPage)
    page.headerCrn().should('contain.text', 'X000001')
    page.headerName().should('contain.text', 'Caroline Wolff')
    cy.get('[data-qa="appointments-header-label"]').should('contain.text', 'Appointments')
    page.getElement('[data-qa="upcomingAppointments"]').should('contain.text', 'Upcoming appointments')
    page
      .getElement('[data-qa="online-checkin-btn"]')
      .should('be.visible')
      .and('contain.text', 'Set up online check ins')
    page.getElement('[data-qa="online-checkin-btn"]').click()
    getCheckinUuid().then(uuid => {
      cy.url().should('contain', `/case/X000001/appointments/${uuid}/check-in/eligibility-check`)
    })
  })
  it('should navigate to supplementary eligibility page when option one is selected', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const checkPage = new EligibilityCheckPage()

    checkPage.getOptionOne().check()
    checkPage.getSubmitBtn().click()

    const supplementaryPage = new EligibilitySupplementaryPage()
    supplementaryPage.checkOnPage()
  })

  it('should navigate to supplementary eligibility page when more than one eligible option is selected', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const checkPage = new EligibilityCheckPage()

    checkPage.getOptionOne().check()
    checkPage.getOptionTwo().check()

    checkPage.getSubmitBtn().click()

    const supplementaryPage = new EligibilitySupplementaryPage()
    supplementaryPage.checkOnPage()
  })

  it('should navigate to full eligibility choice when "None of these apply" is selected', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const checkPage = new EligibilityCheckPage()

    checkPage.getNoneOption().check()
    checkPage.getSubmitBtn().click()

    const fullPage = new EligibilityFullPage()
  })
  it('should navigate to SPO approval when "To replace some face-to-face contact" radio is selected', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()

    const checkPage = new EligibilityCheckPage()
    checkPage.getNoneOption().check()
    checkPage.getSubmitBtn().click()

    const fullPage = new EligibilityFullPage()
    fullPage.getReplacementRadio().check()
    fullPage.getSubmitBtn().click()

    const spoApprovalPage = new EligibilitySPOApprovalPage()
    spoApprovalPage.checkOnPage()
  })

  it('should navigate to rationale page when SPO approval checkbox is checked', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()

    const checkPage = new EligibilityCheckPage()
    checkPage.getNoneOption().check()
    checkPage.getSubmitBtn().click()

    const fullPage = new EligibilityFullPage()
    fullPage.getReplacementRadio().check()
    fullPage.getSubmitBtn().click()

    const spoApprovalPage = new EligibilitySPOApprovalPage()
    spoApprovalPage.checkOnPage()
    spoApprovalPage.getCheckbox()
    spoApprovalPage.getCheckbox().check()
    spoApprovalPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.checkOnPage()
  })

  it('should navigate to rationale page when "As well as existing face-to-face contact" radio is selected', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()

    const checkPage = new EligibilityCheckPage()
    checkPage.getNoneOption().check()
    checkPage.getSubmitBtn().click()

    const fullPage = new EligibilityFullPage()
    fullPage.getSupplementaryRadio().check()
    fullPage.getSubmitBtn().click()

    const rationalePage = new RationalePage()
    rationalePage.checkOnPage()
  })

  it('should navigate to denied page when option 10 (Intensive Supervision Court pilot case) is selected', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const checkPage = new EligibilityCheckPage()
    checkPage.getOptionNine().check()
    checkPage.getSubmitBtn().click()
    const deniedPage = new EligibilityDeniedPage()
    deniedPage.checkOnPage()
  })

  it('should navigate to denied page when option 10 (Intensive Supervision Court pilot case) is selected alongside other eligible choices', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const checkPage = new EligibilityCheckPage()
    checkPage.getOptionOne().check()
    checkPage.getOptionNine().check()
    checkPage.getSubmitBtn().click()
    const deniedPage = new EligibilityDeniedPage()
    deniedPage.checkOnPage()
  })

  it('should show validation errors when no option is selected', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const checkPage = new EligibilityCheckPage()
    checkPage.getSubmitBtn().click()
    cy.get('.govuk-error-summary').should('be.visible')
    cy.get('.govuk-error-message').should('contain', 'Select if any of these apply')
  })

  it('should able to submit rationale details', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
  })

  it('rationale page should fail with validation errors', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()

    rationalePage.getSubmitBtn().click()
    rationalePage.getErrorSummaryBox().should('be.visible')
  })

  it('check-in frequency page should fail with validation errors', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    dateFrequencyPage.getSubmitBtn().click()
    dateFrequencyPage.checkErrorSummaryBox([
      'Enter the date you would like the person to complete their first check in',
      'Select how often you would like the person to check in',
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
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
    dateFrequencyPage.getFrequency().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    dateFrequencyPage.getSubmitBtn().click()
    const contactPreferencePage = new ContactPreferencePage()
    contactPreferencePage.checkOnPage()
  })

  it('contact preference page should fail with validation errors', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
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
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
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
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
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

  it('Should able to choose photo options', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
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

  it('Should able to upload a pic and show rules page', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
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
    const uploadAPhoto = new UploadAPhotoPage()
    uploadAPhoto.checkOnPage()
    uploadAPhoto.uploadPhoto('person.jpg')
    uploadAPhoto.continueButton().click()
    const photoRules = new PhotoRulesPage()
    photoRules.checkOnPage()
    photoRules.getBackLink().click()
    uploadAPhoto.checkOnPage()
  })

  it('Should able to show cya and confirm page', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
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
    const uploadAPhoto = new UploadAPhotoPage()
    uploadAPhoto.checkOnPage()
    uploadAPhoto.uploadPhoto('person.jpg')
    uploadAPhoto.continueButton().click()
    const photoRules = new PhotoRulesPage()
    photoRules.checkOnPage()
    photoRules.getSubmitBtn().click()
    const checkYourAnswersPage = new CheckYourAnswersPage()
    checkYourAnswersPage.checkOnPage()
    checkYourAnswersPage.getSubmitBtn().click()
    const checkinConfirmationPage = new CheckinConfirmationPage()
    checkinConfirmationPage.checkOnPage()
  })

  it('Should able to take a photo and show cya and confirm page', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
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
    takeAPhotoOptionsPage.getPhotoOptions().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    takeAPhotoOptionsPage.getSubmitBtn().click()
    const takeAPhotoPage = new TakeAPhotoPage()
    takeAPhotoPage.checkOnPage()
    takeAPhotoPage.getSubmitBtn().click()
    const photoRules = new PhotoRulesPage()
    photoRules.checkOnPage()
    photoRules.getSubmitBtn().click()
    const checkYourAnswersPage = new CheckYourAnswersPage()
    checkYourAnswersPage.checkOnPage()
    checkYourAnswersPage.getSubmitBtn().click()
    const checkinConfirmationPage = new CheckinConfirmationPage()
    checkinConfirmationPage.checkOnPage()
  })

  it('Should able to change options from cya', () => {
    loadPage()
    cy.get('[data-qa="online-checkin-btn"]').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
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
    takeAPhotoOptionsPage.getPhotoOptions().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    takeAPhotoOptionsPage.getSubmitBtn().click()
    const takeAPhotoPage = new TakeAPhotoPage()
    takeAPhotoPage.checkOnPage()
    takeAPhotoPage.getSubmitBtn().click()
    const photoRules = new PhotoRulesPage()
    photoRules.checkOnPage()
    photoRules.getSubmitBtn().click()
    const checkYourAnswersPage = new CheckYourAnswersPage()
    checkYourAnswersPage.checkOnPage()

    // Rationale change
    checkYourAnswersPage
      .getSummaryListRow(1)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Low risk of reoffending')
    checkYourAnswersPage.getElementData('rationaleAction').click()
    rationalePage.checkOnPage()
    rationalePage.rationaleNotes().find('textarea').clear()
    rationalePage.rationaleNotes().find('textarea').type('Hard for them to travel to the office')
    rationalePage.getSubmitBtn().click()
    checkYourAnswersPage.checkOnPage()
    checkYourAnswersPage
      .getSummaryListRow(1)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Hard for them to travel to the office')

    // Date change
    checkYourAnswersPage.getElementData('dateAction').click()
    dateFrequencyPage.checkOnPage()
    dateFrequencyPage.getSubmitBtn().click()
    checkYourAnswersPage.checkOnPage()
    checkYourAnswersPage.getSummaryListRow(3).find('.govuk-summary-list__value').should('contain.text', 'Every week')
    checkYourAnswersPage.getElementData('intervalAction').click()
    dateFrequencyPage.checkOnPage()
    dateFrequencyPage.getFrequency().find('.govuk-radios__item').eq(2).find('.govuk-radios__input').click()
    dateFrequencyPage.getSubmitBtn().click()
    checkYourAnswersPage.checkOnPage()
    checkYourAnswersPage.getSummaryListRow(3).find('.govuk-summary-list__value').should('contain.text', 'Every 4 weeks')

    // Contact preference change
    checkYourAnswersPage.getSummaryListRow(4).find('.govuk-summary-list__value').should('contain.text', 'Text message')
    checkYourAnswersPage.getElementData('preferredComsAction').click()
    contactPreferencePage.checkOnPage()
    contactPreferencePage
      .getCheckInPreferredComs()
      .find('.govuk-radios__item')
      .eq(1)
      .find('.govuk-radios__input')
      .click()
    contactPreferencePage.getSubmitBtn().click()
    checkYourAnswersPage.checkOnPage()
    checkYourAnswersPage.getSummaryListRow(4).find('.govuk-summary-list__value').should('contain.text', 'Email')

    // Mobile
    checkYourAnswersPage.getElementData('checkInMobileAction').click()
    contactPreferencePage.checkOnPage()
    contactPreferencePage.getChangeLink().click()
    const editContactPreferencePage = new EditContactPreferencePage()
    editContactPreferencePage.checkOnPage()
    editContactPreferencePage
      .getAlert()
      .should('be.visible')
      .and(
        'contain',
        'If you change contact details here, this will update the record in NDelius. The contact details must belong to the person.',
      )
    editContactPreferencePage.getSubmitBtn().click()
    contactPreferencePage.checkOnPage()
    contactPreferencePage.getSubmitBtn().click()
    checkYourAnswersPage.checkOnPage()

    // photo options
    checkYourAnswersPage
      .getSummaryListRow(7)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Take a photo using this device')
    checkYourAnswersPage.getElementData('photoUploadOptionAction').click()
    takeAPhotoOptionsPage.checkOnPage()
    takeAPhotoOptionsPage.getPhotoOptions().find('.govuk-radios__item').eq(1).find('.govuk-radios__input').click()
    takeAPhotoOptionsPage.getSubmitBtn().click()
    const uploadAPhoto = new UploadAPhotoPage()
    uploadAPhoto.checkOnPage()
    uploadAPhoto.uploadPhoto('person.jpg')
    uploadAPhoto.continueButton().click()

    photoRules.checkOnPage()
    photoRules.getSubmitBtn().click()
    checkYourAnswersPage.checkOnPage()
    checkYourAnswersPage
      .getSummaryListRow(7)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Upload a photo')
  })
})

context('check-ins error scenario ', () => {
  it('should show error page when update fails with 404 HTTP response code', () => {
    loadPage()
    cy.task('stubUpdatePersonalContact404Response')
    cy.get('[data-qa="online-checkin-btn"]').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
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

  it('should show error page when update fails with 500 HTTP response code', () => {
    loadPage()
    cy.task('stubUpdatePersonalContact500Response')
    cy.get('[data-qa="online-checkin-btn"]').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
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

  it('Should able to show error message when same phone / email already registered', () => {
    loadPage()
    cy.task('stubOffenderSetup422Response')
    cy.get('[data-qa="online-checkin-btn"]').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
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
    const uploadAPhoto = new UploadAPhotoPage()
    uploadAPhoto.checkOnPage()
    uploadAPhoto.uploadPhoto('person.jpg')
    uploadAPhoto.continueButton().click()
    const photoRules = new PhotoRulesPage()
    photoRules.checkOnPage()
    photoRules.getSubmitBtn().click()
    const checkYourAnswersPage = new CheckYourAnswersPage()
    checkYourAnswersPage.checkOnPage()
    checkYourAnswersPage.getSubmitBtn().click()
    checkYourAnswersPage
      .getErrorText()
      .should(
        'contain.text',
        "The email address or phone number you've entered is already associated with another person",
      )
  })

  it('Should able to show check ins registration error message', () => {
    loadPage()
    cy.task('stubOffenderSetup500Response')
    cy.get('[data-qa="online-checkin-btn"]').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()
    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
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
    const uploadAPhoto = new UploadAPhotoPage()
    uploadAPhoto.checkOnPage()
    uploadAPhoto.uploadPhoto('person.jpg')
    uploadAPhoto.continueButton().click()
    const photoRules = new PhotoRulesPage()
    photoRules.checkOnPage()
    photoRules.getSubmitBtn().click()
    const checkYourAnswersPage = new CheckYourAnswersPage()
    checkYourAnswersPage.checkOnPage()
    checkYourAnswersPage.getSubmitBtn().click()
    checkYourAnswersPage.getErrorText().should('contain.text', 'An error occurred during registration')
  })

  it('Should able to show error page, when checkin registration fails', () => {
    loadPage()

    cy.task('stubOffenderSetupComplete500Response')
    cy.get('[data-qa="online-checkin-btn"]').click()

    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.getOptionOne().click()
    eligibilityCheckPage.getSubmitBtn().click()
    const eligibilitySupplementaryPage = new EligibilitySupplementaryPage()
    eligibilitySupplementaryPage.checkOnPage()
    eligibilitySupplementaryPage.getSubmitBtn().click()
    const rationalePage = new RationalePage()
    rationalePage.rationaleNotes().find('textarea').type('Low risk of reoffending')
    rationalePage.getSubmitBtn().click()
    const dateFrequencyPage = new DateFrequencyPage()

    dateFrequencyPage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    dateFrequencyPage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
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
    const uploadAPhoto = new UploadAPhotoPage()
    uploadAPhoto.checkOnPage()
    uploadAPhoto.uploadPhoto('person.jpg')
    uploadAPhoto.continueButton().click()
    const photoRules = new PhotoRulesPage()
    photoRules.checkOnPage()

    photoRules.getSubmitBtn().click()
    const checkYourAnswersPage = new CheckYourAnswersPage()
    checkYourAnswersPage.checkOnPage()
    checkYourAnswersPage.getSubmitBtn().click()
    cy.get('h1').should('contain.text', 'Sorry, there is a problem with the service')
    cy.get('[data-qa="errorMessage"]').should(
      'contain.html',
      '<p>Try again later.</p><p>Any information you entered has not been saved. When the service is available, you will need to start again.</p>',
    )
  })
})

context('check-ins overview and manage pages', () => {
  it('should show online check ins section with check in details', () => {
    cy.task('resetMocks')
    cy.task('stubGetUpcomingCheckinQuestions')
    cy.visit(`/case/X778160`)
    const overviewPage = new OverviewPage()
    overviewPage.checkOnPage()
    overviewPage.getElementData('checkinCard').should('contain.text', 'Online check ins')
    overviewPage.getElementData('checkinCard').find('.app-summary-card__actions').should('exist')
    overviewPage.getElementData('nextCheckinDueLabel').should('contain.text', 'Next check in due')
    const expectedDate = DateTime.now().plus({ days: 5 }).toFormat('d MMMM yyyy')
    overviewPage.getElementData('nextCheckInValue').should('contain.text', expectedDate)
    overviewPage.getElementData('frequencyLabel').should('contain.text', 'Frequency')
    overviewPage.getElementData('frequencyValue').should('contain.text', 'Every week')
    overviewPage.getElementData('contactPrefLabel').should('contain.text', 'Contact preferences')
    overviewPage.getElementData('contactPrefValue').should('contain.text', 'Text message')
    overviewPage.getElementData('checkinCard').find('.app-summary-card__actions').should('exist')
    overviewPage
      .getElementData('checkinCard')
      .find('.govuk-link')
      .should('contain.text', 'View all online check in details')
  })

  it('should show online check ins due section ', () => {
    cy.task('resetMocks')
    cy.task('stubGetUpcomingCheckinQuestions')
    cy.visit(`/case/X000001`)
    const overviewPage = new OverviewPage()
    overviewPage.checkOnPage()
    overviewPage.getElementData('checkinCard').should('contain.text', 'Online check ins')
    overviewPage.getElementData('checkinCard').find('.app-summary-card__actions').should('exist')
    overviewPage.getElementData('checkinDueLabel').should('contain.text', 'First check in due')
    overviewPage.getElementData('checkinDueValue').should('contain.text', 'Online check ins not set up')
    overviewPage.getElementData('checkinCard').find('.app-summary-card__actions').should('exist')
    overviewPage.getElementData('checkinCard').find('.govuk-link').should('contain.text', 'Set up online check ins')
    overviewPage.getElementData('checkinCard').find('.govuk-link').click()
    const eligibilityCheckPage = new EligibilityCheckPage()
    eligibilityCheckPage.checkOnPage()
    eligibilityCheckPage.getBackLink().click()
    overviewPage.checkOnPage()
  })

  it('should show checkin details', () => {
    cy.task('resetMocks')
    cy.task('stubGetUpcomingCheckinQuestions')
    cy.visit(`/case/X778160/appointments`)
    const appointmentsPage = new AppointmentsPage()
    appointmentsPage.checkOnPage()
    appointmentsPage
      .getElement('[data-qa="online-manage-btn"]')
      .should('be.visible')
      .and('contain.text', 'Manage online check ins')
    appointmentsPage.getElement('[data-qa="online-manage-btn"]').click()
    const manageCheckins = new ManageCheckins()
    manageCheckins.checkOnPage()

    cy.visit(`/case/X778160`)
    const overviewPage = new OverviewPage()
    overviewPage.checkOnPage()
    overviewPage
      .getElementData('checkinCard')
      .find('.govuk-link')
      .should('contain.text', 'View all online check in details')
    overviewPage.getElementData('checkinCard').find('.govuk-link').click()

    manageCheckins.checkOnPage()
    manageCheckins.getElementData('checkinSettingsCard').should('contain.text', 'Check in settings')
    manageCheckins.getElementData('nextCheckinDueLabel').should('contain.text', 'Next check in')
    const expectedDate = DateTime.now().plus({ days: 5 }).toFormat('d MMMM yyyy')
    manageCheckins.getElementData('nextCheckInValue').should('contain.text', expectedDate)
    manageCheckins.getElementData('frequencyLabel').should('contain.text', 'Frequency')
    manageCheckins.getElementData('frequencyValue').should('contain.text', 'Every week')
    manageCheckins.getElementData('checkinSettingsCard').find('.govuk-link').should('contain.text', 'Change')

    manageCheckins.getElementData('checkinContactCard').should('contain.text', 'Contact details')
    manageCheckins.getElementData('checkinContactCard').find('.govuk-link').should('contain.text', 'Change')
    manageCheckins.getElementData('methodLabel').should('contain.text', 'Mobile number')
    manageCheckins.getElementData('methodValue').should('contain.text', '071838893')

    manageCheckins.getElementData('photoCard').should('contain.text', 'Photo')
    manageCheckins.getElementData('photoLabel').should('contain.text', 'Photo of Alton')
    manageCheckins.getImage().should('have.attr', 'src', '/assets/images/placeholder.png')
    manageCheckins.getImage().should('have.attr', 'alt', 'Image of Alton Berge')
  })

  it('should able to visit contact details page', () => {
    cy.task('resetMocks')
    cy.visit(`/case/X778160`)
    const overviewPage = new OverviewPage()
    overviewPage.checkOnPage()
    overviewPage
      .getElementData('checkinCard')
      .find('.govuk-link')
      .should('contain.text', 'View all online check in details')
    overviewPage.getElementData('checkinCard').find('.govuk-link').click()

    const manageCheckins = new ManageCheckins()
    manageCheckins.checkOnPage()
    manageCheckins.getElementData('checkinContactCard').should('contain.text', 'Contact details')
    manageCheckins.getElementData('checkinContactCard').find('.govuk-link').should('contain.text', 'Change')
    manageCheckins.getElementData('checkinContactCard').find('.govuk-link').click()
    const manageContact = new ManageContactPage()
    manageContact.checkOnPage()

    manageContact.getElement('button[name="change"][value="mobile"]').click()
    const manageEditContactPage = new ManageEditContactPage()
    manageEditContactPage.checkOnPage()
    manageEditContactPage.getElement('a.govuk-back-link').should('be.visible').click()
    manageContact.checkOnPage()

    manageContact.getElement('button[name="change"][value="emailAddress"]').click()
    manageEditContactPage.checkOnPage()
    manageEditContactPage
      .getAlert()
      .should('be.visible')
      .and(
        'contain',
        'If you change contact details here, this will update the record in NDelius. The contact details must belong to the person.',
      )
    manageEditContactPage.getBackLink().click()
    manageContact.checkOnPage()
  })

  it('should able to vist change settings page', () => {
    cy.task('resetMocks')
    cy.visit(`/case/X778160/appointments/check-in/manage/3fa85f64-5717-4562-b3fc-2c963f66afa7`)
    const manageCheckins = new ManageCheckins()
    manageCheckins.checkOnPage()
    manageCheckins.getElementData('checkinSettingsCard').should('contain.text', 'Check in settings')
    manageCheckins.getElementData('checkinSettingsCard').find('.govuk-link').should('contain.text', 'Change')
    manageCheckins.getElementData('checkinSettingsCard').find('.govuk-link').click()
    const changeSettingsPage = new ChangeSettingsPage()
    changeSettingsPage.checkOnPage()
    changeSettingsPage
      .getElementData('checkInDate')
      .find('input.moj-js-datepicker-input')
      .clear()
      .type('3/11/2025')
      .blur()
    changeSettingsPage
      .getElementData('checkInFrequency')
      .find('input[type="radio"][value="WEEKLY"]')
      .should('be.checked')
    changeSettingsPage.getSubmitBtn().click()
    const appointmentsPage = new AppointmentsPage()
    appointmentsPage.checkOnPage()
  })

  it('should able to stop check in', () => {
    cy.task('resetMocks')
    cy.visit(`/case/X778160/appointments/check-in/manage/3fa85f64-5717-4562-b3fc-2c963f66afa7`)
    const manageCheckins = new ManageCheckins()
    manageCheckins.checkOnPage()
    manageCheckins.getElementData('stop-checkin-btn').click()
    const stopCheckIn = new StopCheckins()
    stopCheckIn.getSubmitBtn().click()
    stopCheckIn.checkErrorSummaryBox([
      'Enter the reason for stopping',
      'Select yes if the reason for stopping includes sensitive information',
    ])
    stopCheckIn.getElementData('stop-checkin-reason').type('No longer available')
    stopCheckIn.getElementData('sensitiveContact').find('input[type="radio"][value="false"]').click({ force: true })
    stopCheckIn.getSubmitBtn().click()
    manageCheckins.checkOnPage()
  })

  it('should able to stop and restart online check ins', () => {
    cy.task('resetMocks')
    cy.visit(`/case/X778160/appointments/check-in/manage/3fa85f64-5717-4562-b3fc-2c963f66afa7/restart-checkin`)

    const restartDatePage = new RestartDateFrequencyPage()
    restartDatePage.checkOnPage()
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    restartDatePage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
    restartDatePage.getFrequency().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    restartDatePage.getSubmitBtn().click()

    const restartContactPage = new RestartContactPreferencePage()
    restartContactPage.checkOnPage()
    restartContactPage.getCheckInPreferredComs().find('input[value="PHONE"]').should('be.checked')
    restartContactPage.getMobileNumberChangeLink().click()
    const restartEditPage = new RestartEditContactPreferencePage()
    restartEditPage.checkOnPage()
    restartEditPage.getAlert().should('be.visible').and('contain.text', 'update the record in NDelius')
    restartEditPage.getMobileInput().clear().type('07700900123')
    restartEditPage.getSubmitBtn().click()
    restartContactPage.checkOnPage()
    restartContactPage.getElementData('updateBanner').should('contain.text', 'Contact details saved')
    restartContactPage.getSubmitBtn().click()
    const restartSummaryPage = new RestartCheckYourAnswersPage()
    restartSummaryPage.checkOnPage()
    restartSummaryPage.getSummaryValue(2).should('contain.text', 'Every week')
    restartSummaryPage.getSubmitBtn().click()
    const restartConfirmPage = new RestartConfirmationPage()
    restartConfirmPage.checkOnPage()
    restartConfirmPage.getPanel().should('contain.text', 'Online check ins restarted')
  })
})

context('check-ins add questions pages', () => {
  it('should allow a user to start the add questions to online check ins journey', () => {
    cy.task('resetMocks')
    cy.task('stubGetUpcomingCheckinQuestions')
    cy.task('stubGetUpcomingCheckinQuestionItems')
    cy.task('stubAssignQuestions')
    cy.visit('/case/X000001/appointments/check-in/manage/3fa85f64-5717-4562-b3fc-2c963f66afa7/questions/start')
    const instructionsPage = new InstructionsPage()
    instructionsPage.clickContinue()
    const addQuestionsPage = new AddQuestionsPage()
    addQuestionsPage.checkOnPage()
  })

  it('should allow a user to view the default questions preview pages', () => {
    cy.task('resetMocks')
    cy.task('stubGetQuestionsTemplates')
    cy.task('stubGetUpcomingCheckinQuestions')
    cy.task('stubGetUpcomingCheckinQuestionItems')
    cy.task('stubAssignQuestions')
    cy.visit('/case/X000001/appointments/check-in/manage/3fa85f64-5717-4562-b3fc-2c963f66afa7/questions/start')
    const instructionsPage = new InstructionsPage()
    instructionsPage.clickContinue()
    const addQuestionsPage = new AddQuestionsPage()
    addQuestionsPage.checkOnPage()
    addQuestionsPage.getElement('.govuk-table').should('contain.text', 'How have you been feeling')
    addQuestionsPage.getElement('.govuk-table').should('contain.text', 'Is there anything you need support with')
    addQuestionsPage.clickPreviewFeeling()
    const feelingPreview = new PreviewFeelingPage()
    feelingPreview.checkOnPage()
    feelingPreview.getElement('.govuk-textarea').first().should('have.attr', 'readonly')
    feelingPreview.clickBackToQuestions()
    addQuestionsPage.checkOnPage()
    addQuestionsPage.clickPreviewSupport()
    const supportPreview = new PreviewSupportPage()
    supportPreview.checkOnPage()
    supportPreview.clickBackToQuestions()
    addQuestionsPage.checkOnPage()
    addQuestionsPage.clickCancel()
    instructionsPage.checkOnPage()
  })

  it('should show the "Add question" button for additional custom questions', () => {
    cy.task('resetMocks')
    cy.task('stubGetQuestionsTemplates')
    cy.task('stubGetUpcomingCheckinQuestions')
    cy.task('stubGetUpcomingCheckinQuestionItems')
    cy.task('stubAssignQuestions')
    cy.visit('/case/X000001/appointments/check-in/manage/3fa85f64-5717-4562-b3fc-2c963f66afa7/questions/add')
    const addQuestionsPage = new AddQuestionsPage()
    addQuestionsPage.getElement('[data-qa="add-question-btn"]').should('be.visible')
  })

  it('should show the "Save questions" button', () => {
    cy.task('resetMocks')
    cy.task('stubGetQuestionsTemplates')
    cy.task('stubGetUpcomingCheckinQuestions')
    cy.task('stubGetUpcomingCheckinQuestionItems')
    cy.task('stubAssignQuestions')
    cy.visit('/case/X000001/appointments/check-in/manage/3fa85f64-5717-4562-b3fc-2c963f66afa7/questions/add')
    const addQuestionsPage = new AddQuestionsPage()
    addQuestionsPage.getElement('[data-qa="save-questions-btn"]').should('be.visible')
  })

  it('should show the "cancel and go back" button ', () => {
    cy.task('resetMocks')
    cy.task('stubGetQuestionsTemplates')
    cy.task('stubGetUpcomingCheckinQuestions')
    cy.task('stubGetUpcomingCheckinQuestionItems')
    cy.task('stubAssignQuestions')
    cy.visit('/case/X000001/appointments/check-in/manage/3fa85f64-5717-4562-b3fc-2c963f66afa7/questions/add')
    const addQuestionsPage = new AddQuestionsPage()
    addQuestionsPage.getElement('[data-qa="cancel-link"]').should('be.visible')
  })

  it('should trigger validation errors when trying to save a blank custom question', () => {
    cy.task('resetMocks')
    cy.task('stubGetQuestionsTemplates')
    cy.task('stubGetUpcomingCheckinQuestions')
    cy.task('stubGetUpcomingCheckinQuestionItems')
    cy.task('stubAssignQuestions')
    cy.visit('/case/X000001/appointments/check-in/manage/3fa85f64-5717-4562-b3fc-2c963f66afa7/questions/add')

    const addQuestionsPage = new AddQuestionsPage()
    addQuestionsPage.clickAddQuestion()

    const listQuestionsPage = new ListQuestionsPage()
    listQuestionsPage.clickAddTemplateByIndex(0)

    const editQuestionPage = new EditQuestionPage()
    editQuestionPage.clickContinue()

    editQuestionPage.checkValidationError('Enter what you want to ask')
  })

  it('should allow a user to add, edit, and delete a custom question', () => {
    cy.task('resetMocks')
    cy.task('stubGetQuestionsTemplates')
    cy.task('stubGetUpcomingCheckinQuestions')
    cy.task('stubGetUpcomingCheckinQuestionItems')
    cy.task('stubAssignQuestions')
    cy.visit('/case/X000001/appointments/check-in/manage/3fa85f64-5717-4562-b3fc-2c963f66afa7/questions/start')

    const instructionsPage = new InstructionsPage()
    instructionsPage.clickContinue()

    const addQuestionsPage = new AddQuestionsPage()

    // Add "How has [your unpaid work] been going recently?"
    addQuestionsPage.clickAddQuestion()
    const listQuestionsPage = new ListQuestionsPage()
    listQuestionsPage.clickAddTemplateByIndex(0)

    const editQuestionPage = new EditQuestionPage()
    editQuestionPage.enterDraftQuestionInput('your unpaid work')
    editQuestionPage.clickContinue()

    addQuestionsPage.checkOnPage()
    addQuestionsPage.verifyQuestionInList('your unpaid work')

    // Edit "How has [your college course] been going recently?"
    addQuestionsPage.clickEditForQuestion(0)

    editQuestionPage.checkOnPage()
    editQuestionPage.enterDraftQuestionInput('your college course')
    editQuestionPage.clickContinue()

    addQuestionsPage.checkOnPage()
    addQuestionsPage.verifyQuestionInList('your college course')
    addQuestionsPage.verifyQuestionNotInList('your unpaid work')

    // Delete
    addQuestionsPage.clickDeleteForQuestion(0)

    addQuestionsPage.checkOnPage()
    addQuestionsPage.verifyQuestionNotInList('your college course')
  })

  it('should enforce the maximum limit of 3 custom questions', () => {
    cy.task('resetMocks')
    cy.task('stubGetQuestionsTemplates')
    cy.task('stubGetUpcomingCheckinQuestions')
    cy.task('stubGetUpcomingCheckinQuestionItems')
    cy.task('stubAssignQuestions')
    cy.visit('/case/X000001/appointments/check-in/manage/3fa85f64-5717-4562-b3fc-2c963f66afa7/questions/start')
    const instructionsPage = new InstructionsPage()
    instructionsPage.clickContinue()

    const addQuestionsPage = new AddQuestionsPage()

    // Add "How has [your apprenticeship] been going recently?"
    addQuestionsPage.clickAddQuestion()
    const listQuestionsPage = new ListQuestionsPage()
    listQuestionsPage.clickAddTemplateByIndex(0)
    const editQuestionPage = new EditQuestionPage()
    editQuestionPage.checkOnPage()
    editQuestionPage.enterDraftQuestionInput('your apprenticeship')
    editQuestionPage.clickContinue()

    // Add "How have things been feeling [at home] recently?"
    addQuestionsPage.checkOnPage()
    addQuestionsPage.clickAddQuestion()
    listQuestionsPage.checkOnPage()
    listQuestionsPage.clickAddTemplateByIndex(1)
    editQuestionPage.checkOnPage()
    editQuestionPage.enterDraftQuestionInput('at home')
    editQuestionPage.clickContinue()

    // Add "How is [your physical health]?"
    addQuestionsPage.checkOnPage()
    addQuestionsPage.clickAddQuestion()
    listQuestionsPage.checkOnPage()
    listQuestionsPage.clickAddTemplateByIndex(1)
    editQuestionPage.checkOnPage()
    editQuestionPage.enterDraftQuestionInput('your physical health')
    editQuestionPage.clickContinue()
    addQuestionsPage.checkOnPage()
    addQuestionsPage.verifyQuestionInList('your apprenticeship')
    addQuestionsPage.verifyQuestionInList('at home')
    addQuestionsPage.verifyQuestionInList('your physical health')
    addQuestionsPage.verifyAddQuestionButtonHidden()
  })
})

context('check-ins flag guard', () => {
  beforeEach(() => {
    cy.task('resetMocks')
    cy.task('stubDisableESupervisionCheckins')
  })

  it('returns 403 for a /check-in/manage subpath when the flag is disabled', () => {
    cy.request({
      url: '/case/X000001/appointments/check-in/manage/3fa85f64-5717-4562-b3fc-2c963f66afa7/questions/start',
      failOnStatusCode: false,
    }).then(response => {
      expect(response.status).to.eq(403)
    })
  })

  it('returns 403 for an /:id/check-in subpath when the flag is disabled', () => {
    cy.request({
      url: '/case/X000001/appointments/3fa85f64-5717-4562-b3fc-2c963f66afa7/check-in/eligibility-check',
      failOnStatusCode: false,
    }).then(response => {
      expect(response.status).to.eq(403)
    })
  })
})
