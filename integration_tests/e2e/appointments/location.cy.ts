import AppointmentDateTimePage from '../../pages/appointments/date-time.page'
import AppointmentLocationPage from '../../pages/appointments/location.page'
import { completeAttendancePage, completeSentencePage, completeTypePage, crn, uuid, checkPopHeader } from './imports'
import AttendancePage from '../../pages/appointments/attendance.page'
import AppointmentLocationNotInListPage from '../../pages/appointments/location-not-in-list.page'
import Page from '../../pages/page'

const loadPage = (typeOptionIndex = 1) => {
  completeSentencePage()
  completeTypePage(typeOptionIndex)
  completeAttendancePage()
}

describe('Pick a location for this appointment', () => {
  let locationPage: AppointmentLocationPage
  let dateTimePage: AppointmentDateTimePage
  let locationNotInListPage: AppointmentLocationNotInListPage
  beforeEach(() => {
    cy.task('resetMocks')
  })
  describe('Page is rendered with options for an appointment type which requires a location', () => {
    beforeEach(() => {
      loadPage()
      locationPage = new AppointmentLocationPage()
    })
    it('should render the pop header', () => {
      checkPopHeader('Alton Berge', true)
    })
    it('should display the options', () => {
      locationPage.getRadioLabel('locationCode', 1).should('contain.text', 'Hmp Wakefield')
      locationPage.getRadioLabel('locationCode', 2).should('contain.text', '102 Petty France')
      locationPage.getRadioLabel('locationCode', 3).should('contain.text', 'The Building')
      locationPage
        .getRadioLabel('locationCode', 5)
        .should('contain.text', 'The location I’m looking for is not in this list')
    })
    it('should display the continue button', () => {
      locationPage.getSubmitBtn().should('contain.text', 'Continue')
    })
  })
  describe('Page is rendered with options for an appointment type which does not require a location', () => {
    beforeEach(() => {
      const typeOptionIndex = 2
      loadPage(typeOptionIndex)
      locationPage = new AppointmentLocationPage()
    })
    it('should display the non-mandatory location option', () => {
      locationPage.getRadioLabel('locationCode', 6).should('contain.text', 'NO_LOCATION_REQUIRED')
    })
  })

  describe('Page is rendered with no locations for an appointment type which requires a location', () => {
    it('should redirect to the location not in list page', () => {
      cy.task('stubNoUserLocationsFound')
      loadPage()
      const page = Page.verifyOnPage(AppointmentLocationNotInListPage)
    })
  })
  describe('Page is rendered with no locations for an appointment type which does not require a location', () => {
    it('should only display the last 2 radio options', () => {
      cy.task('stubNoUserLocationsFound')
      const typeOptionIndex = 2
      loadPage(typeOptionIndex)
      locationPage = new AppointmentLocationPage()
      locationPage
        .getRadioLabel('locationCode', 1)
        .should('contain.text', 'The location I’m looking for is not in this list')
      locationPage.getRadioLabel('locationCode', 2).should('contain.text', 'NO_LOCATION_REQUIRED')
      cy.get('[data-qa="locationOption"]').should('not.exist')
    })
    it('should not display the radio list divider', () => {
      cy.get('.govuk-radios__divider').should('not.exist')
    })
  })

  describe('Back link is clicked', () => {
    beforeEach(() => {
      loadPage()
      locationPage = new AppointmentLocationPage()
      locationPage.getBackLink().click()
    })
    it('should render the sentence page', () => {
      const attendancePage = new AttendancePage()
      attendancePage.checkOnPage()
    })
  })

  describe('Continue is clicked without selecting a location', () => {
    beforeEach(() => {
      loadPage()
      locationPage = new AppointmentLocationPage()
      locationPage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      locationPage.checkErrorSummaryBox(['Select an appointment location'])
    })
    it('should display the error message', () => {
      locationPage.getElement(`#appointments-${crn}-${uuid}-user-locationCode-error`).should($error => {
        expect($error.text().trim()).to.include('Select an appointment location')
      })
    })
    it('should focus the first radio button when the summary link is clicked', () => {
      locationPage.getErrorSummaryLink(0).click()
      locationPage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).should('be.focused')
    })
  })

  describe('Location is selected, and continue is clicked', () => {
    beforeEach(() => {
      loadPage()
      locationPage.getElement(`#appointments-${crn}-${uuid}-user-locationCode`).click()
      locationPage.getSubmitBtn().click()
    })
    it('should redirect to the date time page', () => {
      dateTimePage = new AppointmentDateTimePage()
      dateTimePage.checkOnPage()
    })
  })
})
