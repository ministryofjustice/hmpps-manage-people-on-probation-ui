import { DateTime } from 'luxon'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import { statusErrors } from '../../../server/properties/statusErrors'
import AttendedCompliedPage from '../../pages/appointments/attended-complied.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import AppointmentNotePage from '../../pages/appointments/note.page'
import EditContactDetails from '../../pages/personalDetails/editContactDetails'
import TextMessageConfirmationPage from '../../pages/appointments/text-message-confirmation.page'
import IndexPage from '../../pages'

import {
  checkPopHeader,
  checkAppointmentSummary,
  checkUpdateDateTime,
  checkUpdateLocation,
  checkUpdateNotes,
  checkUpdateSensitivity,
  checkUpdateSentence,
  checkUpdateType,
  checkUpdateTextMessageConfirmation,
} from './imports'
import { crn, uuid } from './imports/common'
import {
  completeSentencePage,
  completeTypePage,
  completeLocationDateTimePage,
  completeTextMessageConfirmationPage,
  completeSupportingInformationPage,
  completeAttendedCompliedPage,
  completeAddNotePage,
  completeOutcome,
} from './utils'
import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'

const loadPage = ({
  hasVisor = false,
  typeOptionIndex = 1,
  sentenceOptionIndex = 1,
  notes = true,
  dateInPast = false,
  textMessageOptionIndex = 1,
  textMessageFeatureFlag = true,
  enableNonCompliance = true,
} = {}) => {
  if (!enableNonCompliance) {
    cy.task('stubDisableNonCompliance')
  }
  completeSentencePage({ eventIndex: sentenceOptionIndex })
  completeTypePage(typeOptionIndex, hasVisor)
  completeLocationDateTimePage({ dateInPast })
  if (!dateInPast && textMessageFeatureFlag) {
    completeTextMessageConfirmationPage({ index: textMessageOptionIndex })
    if (textMessageOptionIndex === 2) {
      const page = new EditContactDetails()
      cy.get('[name=phoneNumber]').should('not.exist')
      cy.get('[name=emailAddress]').should('not.exist')
      page.getElementInput('mobileNumber').clear().type('07783889300')
      cy.get('[data-qa=submitBtn]').click()
    }
    completeSupportingInformationPage({ notes })
  }
  if (dateInPast) {
    if (!enableNonCompliance) {
      completeAttendedCompliedPage()
    }
    if (enableNonCompliance) {
      completeOutcome({ outcome: 'ATTENDED_FAILED_TO_COMPLY', action: 'NO_FURTHER_ACTION' })
    }
    completeAddNotePage()
  }
  if (!dateInPast && !textMessageFeatureFlag) {
    completeSupportingInformationPage({ notes })
  }
}

describe('Check your answers then confirm the appointment', () => {
  let confirmPage: AppointmentConfirmationPage
  beforeEach(() => {
    cy.task('resetMocks')
  })
  /*
  describe('Appointment date is in the future', () => {
    it('should render the page', () => {
      loadPage()
      const cyaPage = new AppointmentCheckYourAnswersPage()
      checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: 'X778160' })
      const showsProbationPractitioner = true
      checkAppointmentSummary({ page: cyaPage, probationPractitioner: showsProbationPractitioner })
      cy.get('[data-qa="calendarInviteInset"]').should(
        'contain.text',
        `You'll receive a calendar invite for the appointment.`,
      )
    })

    it('should render the page with VISOR report', () => {
      it('should display the visor report answer', () => {
        cy.task('stubOverviewVisorRegistration')
        loadPage({ hasVisor: true })
        const cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.getSummaryListRow(2).find('.govuk-summary-list__key').should('contain.text', 'VISOR report')
        cyaPage.getSummaryListRow(2).find('.govuk-summary-list__value').should('contain.text', 'Yes')
      })
    })

    it(`should render the page if text message confirmation selected as 'No'`, () => {
      loadPage({ textMessageOptionIndex: 3 })
      const cyaPage = new AppointmentCheckYourAnswersPage()
      checkAppointmentSummary({ page: cyaPage, probationPractitioner: true, sendTextMessage: false })
    })

    it('should render the page when text message confirmation feature flag is disabled', () => {
      cy.task('stubDisableSmsReminders')
      loadPage({ textMessageFeatureFlag: false })
      const cyaPage = new AppointmentCheckYourAnswersPage()
      checkAppointmentSummary({
        page: cyaPage,
        probationPractitioner: true,
        sendTextMessage: false,
        smsFeatureFlagDisabled: true,
      })
    })

    describe('Change appointment values', () => {
      let cyaPage: AppointmentCheckYourAnswersPage
      beforeEach(() => {
        cy.task('resetMocks')
        loadPage()
        cyaPage = new AppointmentCheckYourAnswersPage()
      })
      it('should update the sentence when value is changed', () => {
        checkUpdateSentence(cyaPage)
      })
      it('should update the type when value is changed', () => {
        checkUpdateType(cyaPage)
      })
      it('should update the location when value is changed', () => {
        checkUpdateLocation(cyaPage)
      })
      it('should update the date when value is changed', () => {
        checkUpdateDateTime({ page: cyaPage })
      })
      it('should update the text message confirmation when value is changed', () => {
        checkUpdateTextMessageConfirmation(cyaPage)
      })
      it('should update the notes when value is changed', () => {
        checkUpdateNotes({ page: cyaPage })
      })
      it('should update the sensitivity when value is changed', () => {
        checkUpdateSensitivity({ page: cyaPage })
      })
      it('should update the text message confirmation when mobile number is changed', () => {
        const updateMobileNumber = true
        checkUpdateTextMessageConfirmation(cyaPage, updateMobileNumber)
      })
      it('should update the text message confirmation when mobile number is not changed', () => {
        const updateMobileNumber = false
        checkUpdateTextMessageConfirmation(cyaPage, updateMobileNumber)
      })
    })
    describe('Confirm this appointment', () => {
      let cyaPage: AppointmentCheckYourAnswersPage
      beforeEach(() => {
        loadPage()
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.getSubmitBtn().click()
      })
      it('should submit the appointment and redirect to the confirmation page', () => {
        confirmPage = new AppointmentConfirmationPage()
      })
    })
    describe('Duplicate appointment', () => {
      let cyaPage: AppointmentCheckYourAnswersPage
      beforeEach(() => {
        cy.task('stubAppointmentDuplicate')
        loadPage()
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.getSubmitBtn().click()
      })
      it('should render the 409 error page', () => {
        cy.get('h1').should('contain.text', statusErrors[409].title)
        cy.get('[data-qa="errorMessage"]').should('contain.text', 'Go to the Manage people on probation homepage')
        cy.get('[data-qa="homepageLink"]').click()
        const homepage = new IndexPage()
        homepage.checkOnPage()
      })
    })
  })
*/
  describe('Appointment date is in the past - non compliance disabled', () => {
    const cyaPage = new AppointmentCheckYourAnswersPage()
    beforeEach(() => {
      loadPage({ dateInPast: true, enableNonCompliance: false })
    })
    it('should display the attended and complied row', () => {
      checkAppointmentSummary({
        page: cyaPage,
        probationPractitioner: false,
        dateInPast: true,
        enableNonCompliance: false,
      })
    })
    it('should update the notes when value is changed', () => {
      checkUpdateNotes({ page: cyaPage, dateInPast: true, enableNonCompliance: false })
    })
    it('should update the sensitivity when value is changed', () => {
      checkUpdateSensitivity({ page: cyaPage, dateInPast: true, enableNonCompliance: false })
    })
  })
  describe('Appointment date is in the past - non compliance enabled', () => {
    const cyaPage = new AppointmentCheckYourAnswersPage()
    beforeEach(() => {
      loadPage({ dateInPast: true })
    })
    it('should display the attended and complied row', () => {
      checkAppointmentSummary({ page: cyaPage, probationPractitioner: false, dateInPast: true })
    })
    it('should update the notes when value is changed', () => {
      checkUpdateNotes({ page: cyaPage, dateInPast: true })
    })
    it('should update the sensitivity when value is changed', () => {
      checkUpdateSensitivity({ page: cyaPage, dateInPast: true })
    })
  })

  describe('User updates the appointment date', () => {
    let cyaPage: AppointmentCheckYourAnswersPage
    let logOutcomePage: AttendedCompliedPage
    let supportingInfoPage: AppointmentNotePage
    let addNotePage: AddNotePage
    let textMessageConfirmPage: TextMessageConfirmationPage

    const recordOutcome = `appointments-${crn}-${uuid}-outcomeRecorded`

    const changeDate = ({ dateInPast = false, enableNonCompliance = true } = {}) => {
      loadPage({ dateInPast, enableNonCompliance })
      cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.getSummaryListRow(5).find('.govuk-link').click()
    }

    describe('changes future appointment to past appointment - non compliance disabled', () => {
      beforeEach(() => {
        cy.task('stubDisableNonCompliance')
        changeDate({ enableNonCompliance: false })
        completeLocationDateTimePage({ dateInPast: true })
      })
      it('should redirect to the log an outcome page, then add notes', () => {
        logOutcomePage = new AttendedCompliedPage()
        logOutcomePage.checkPageTitle('Confirm Alton attended and complied')
        cy.get(`#${recordOutcome}`).should('not.be.checked')
        cy.get(`#${recordOutcome}`).click()
        logOutcomePage.getSubmitBtn().click()
        completeAddNotePage({ crnOverride: crn, idOverride: uuid })
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkPageTitle('Check your answers')
      })
    })
    describe('changes future appointment to past appointment - non compliance enabled', () => {
      beforeEach(() => {
        changeDate()
        completeLocationDateTimePage({ dateInPast: true })
      })
      it('should redirect to the log an outcome page, then add notes', () => {
        completeOutcome({ outcome: 'ATTENDED_COMPLIED' })
        completeAddNotePage({ crnOverride: crn, idOverride: uuid })
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkPageTitle('Check your answers')
      })
    })

    describe('changes past appointment to future appointment', () => {
      const dateInPast = true
      beforeEach(() => {
        changeDate({ dateInPast })
        completeLocationDateTimePage()
      })
      it('should redirect to the text message confirmation and supporting information pages', () => {
        textMessageConfirmPage = new TextMessageConfirmationPage()
        textMessageConfirmPage.getSmsOptIn().find(`#appointments-${crn}-${uuid}-smsOptIn`).click()
        textMessageConfirmPage.getSubmitBtn().click()
        supportingInfoPage = new AppointmentNotePage()
        supportingInfoPage.checkOnPage()
        cy.get(`#appointments-${crn}-${uuid}-notes`).should('have.value', '').type('some notes')
        cy.get(`#appointments-${crn}-${uuid}-sensitivity-2`).click()
        supportingInfoPage.getSubmitBtn().click()
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkPageTitle('Check your answers')
      })
    })
    describe('changes future appointment date to another date in the future', () => {
      beforeEach(() => {
        changeDate()
        const now = DateTime.now()
        const dateOverride = now.plus({ days: 3 })
        completeLocationDateTimePage({ dateOverride })
      })
      it('should redirect back to the cya page', () => {
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkPageTitle('Check your answers')
      })
    })

    describe('changes past appointment date to another date in the past - non compliance disabled', () => {
      const dateInPast = true
      beforeEach(() => {
        changeDate({ dateInPast, enableNonCompliance: false })
        const now = DateTime.now()
        const dateOverride = now.minus({ days: 2 })
        completeLocationDateTimePage({ dateOverride })
      })
      it('should redirect to the log an outcome page, then add notes', () => {
        logOutcomePage = new AttendedCompliedPage()
        logOutcomePage.checkPageTitle('Confirm Alton attended and complied')
        cy.get(`#${recordOutcome}`).should('not.be.checked')
        cy.get(`#${recordOutcome}`).click()
        logOutcomePage.getSubmitBtn().click()
        completeAddNotePage({ crnOverride: crn, idOverride: uuid })
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkPageTitle('Check your answers')
      })
    })

    describe('changes past appointment date to another date in the past - non compliance enabled', () => {
      beforeEach(() => {
        changeDate({ dateInPast: true })
        const now = DateTime.now()
        const dateOverride = now.minus({ days: 2 })
        completeLocationDateTimePage({ dateOverride })
      })
      it('should redirect to the log an outcome page, then add notes', () => {
        completeOutcome({ outcome: 'ATTENDED_COMPLIED' })
        completeAddNotePage({ crnOverride: crn, idOverride: uuid })
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkPageTitle('Check your answers')
      })
    })

    describe('submits the same future appointment date', () => {
      beforeEach(() => {
        changeDate()
        completeLocationDateTimePage()
      })
      it('should redirect back to the cya page', () => {
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkPageTitle('Check your answers')
      })
    })

    describe('submits the same past appointment date', () => {
      const dateInPast = true
      beforeEach(() => {
        changeDate({ dateInPast })
        completeLocationDateTimePage({ dateInPast: true })
      })
      it('should redirect back to the cya page', () => {
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkPageTitle('Check your answers')
      })
    })
  })

  describe('Should not navigate to the text message confirmation page if feature flag is disabled', () => {
    beforeEach(() => {
      cy.task('stubDisableSmsReminders')
      loadPage({ textMessageFeatureFlag: false })
      cy.go('back')
      const supportingInfoPage = new AppointmentNotePage()
      supportingInfoPage.getBackLink().click()
      const locationDateTimePage = new AppointmentLocationDateTimePage()
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getSubmitBtn().click()
      supportingInfoPage.getSubmitBtn().click()
    })
    it('should be on the cya page', () => {
      const cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.checkPageTitle('Check your answers')
    })
  })
})
