import { DateTime } from 'luxon'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import IndexPage from '../../pages'

import {
  completeLocationDateTimePage,
  completeSentencePage,
  completeTypePage,
  completeSupportingInformationPage,
  checkPopHeader,
  checkAppointmentSummary,
  checkUpdateDateTime,
  checkUpdateLocation,
  checkUpdateNotes,
  checkUpdateSensitivity,
  checkUpdateSentence,
  checkUpdateType,
  completeAttendedCompliedPage,
  completeAddNotePage,
  crn,
  uuid,
} from './imports'
import { statusErrors } from '../../../server/properties/statusErrors'
import AttendedCompliedPage from '../../pages/appointments/attended-complied.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import AppointmentNotePage from '../../pages/appointments/note.page'

const loadPage = ({
  hasVisor = false,
  typeOptionIndex = 1,
  sentenceOptionIndex = 1,
  notes = true,
  dateInPast = false,
} = {}) => {
  completeSentencePage(sentenceOptionIndex, '')
  completeTypePage(typeOptionIndex, hasVisor)
  completeLocationDateTimePage({ dateInPast })
  if (!dateInPast) {
    completeSupportingInformationPage(notes)
  } else {
    completeAttendedCompliedPage()
    completeAddNotePage()
  }
}

describe('Check your answers then confirm the appointment', () => {
  let confirmPage: AppointmentConfirmationPage
  beforeEach(() => {
    cy.task('resetMocks')
  })
  describe('Appointment date is in the future', () => {
    it('should render the page', () => {
      loadPage()
      const cyaPage = new AppointmentCheckYourAnswersPage()
      checkPopHeader('Alton Berge', true)
      const showsProbationPractitioner = true
      checkAppointmentSummary(cyaPage, showsProbationPractitioner)
      cy.get('[data-qa="calendarInviteInset"]').should(
        'contain.text',
        `You'll receive a calendar invite for the appointment`,
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

    it('should render the page with personal contact', () => {
      loadPage({ hasVisor: false, typeOptionIndex: 2, sentenceOptionIndex: 4 })
      cy.get('[data-qa="appointmentForename"]').should('contain.text', 'Alton')
      cy.get('[data-qa="appointmentSentence"]').should('not.exist')
      cy.get('[data-qa="appointmentRequirement"]').should('not.exist')
      cy.get('[data-qa="appointmentLicenceCondition"]').should('not.exist')
    })

    describe('Change appointment values', () => {
      let cyaPage: AppointmentCheckYourAnswersPage
      beforeEach(() => {
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
        checkUpdateDateTime(cyaPage)
      })
      it('should update the notes when value is changed', () => {
        checkUpdateNotes(cyaPage)
      })
      it('should update the sensitivity when value is changed', () => {
        checkUpdateSensitivity(cyaPage)
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

  describe('Appointment date is in the past', () => {
    beforeEach(() => {
      loadPage({ dateInPast: true })
    })
    it('should display the attended and complied row', () => {
      const cyaPage = new AppointmentCheckYourAnswersPage()
      checkAppointmentSummary(cyaPage, false, true)
      it('should update the notes when value is changed', () => {
        checkUpdateNotes(cyaPage)
      })
      it('should update the sensitivity when value is changed', () => {
        checkUpdateSensitivity(cyaPage)
      })
    })
  })
  describe('User updates the appointment date', () => {
    let cyaPage: AppointmentCheckYourAnswersPage
    let logOutcomePage: AttendedCompliedPage
    let supportingInfoPage: AppointmentNotePage
    let addNotePage: AddNotePage

    const recordOutcome = `appointments-${crn}-${uuid}-outcomeRecorded`

    const changeDate = (dateInPast = false) => {
      loadPage({ dateInPast })
      cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.getSummaryListRow(5).find('.govuk-link').click()
    }

    describe('changes future appointment to past appointment', () => {
      beforeEach(() => {
        changeDate()
        completeLocationDateTimePage({ dateInPast: true })
      })
      it('should redirect to the log an outcome page, then add notes', () => {
        logOutcomePage = new AttendedCompliedPage()
        logOutcomePage.checkPageTitle('Confirm Alton attended and complied')
        cy.get(`#${recordOutcome}`).should('not.be.checked')
        cy.get(`#${recordOutcome}`).click()
        logOutcomePage.getSubmitBtn().click()
        addNotePage = new AddNotePage()
        cy.get(`#appointments-${crn}-${uuid}-notes`).should('have.value', '').type('some notes')
        cy.get(`#appointments-${crn}-${uuid}-sensitivity-2`).click()
        addNotePage.getSubmitBtn().click()
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkOnPage()
      })
    })
    describe('changes past appointment to future appointment', () => {
      const dateInPast = true
      beforeEach(() => {
        changeDate(dateInPast)
        completeLocationDateTimePage() // tomorrow
      })
      it('should redirect to the supporting information page', () => {
        supportingInfoPage = new AppointmentNotePage()
        supportingInfoPage.checkOnPage()
        cy.get(`#appointments-${crn}-${uuid}-notes`).should('have.value', '').type('some notes')
        cy.get(`#appointments-${crn}-${uuid}-sensitivity-2`).click()
        supportingInfoPage.getSubmitBtn().click()
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkOnPage()
      })
    })
    describe('changes future appointment date to another date in the future', () => {
      beforeEach(() => {
        changeDate()
        const now = DateTime.now()
        const dateOverride = now.plus({ days: 2 })
        completeLocationDateTimePage({ dateOverride })
      })
      it('should redirect back to the cya page', () => {
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkOnPage()
      })
    })

    describe('changes past appointment date to another date in the past', () => {
      const dateInPast = true
      beforeEach(() => {
        changeDate(dateInPast)
        changeDate()
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
        addNotePage = new AddNotePage()
        cy.get(`#appointments-${crn}-${uuid}-notes`).should('have.value', '').type('some notes')
        cy.get(`#appointments-${crn}-${uuid}-sensitivity-2`).click()
        addNotePage.getSubmitBtn().click()
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkOnPage()
      })
    })

    describe('submits the same future appointment date', () => {
      beforeEach(() => {
        changeDate()
        completeLocationDateTimePage()
      })
      it('should redirect back to the cya page', () => {
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkOnPage()
      })
    })

    describe('submits the same past appointment date', () => {
      const dateInPast = true
      beforeEach(() => {
        changeDate(dateInPast)
        completeLocationDateTimePage({ dateInPast: true })
      })
      it('should redirect back to the cya page', () => {
        cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkOnPage()
      })
    })
  })
})
