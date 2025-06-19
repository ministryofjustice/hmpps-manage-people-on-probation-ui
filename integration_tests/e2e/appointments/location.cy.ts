import AppointmentDateTimePage from '../../pages/appointments/date-time.page'
import AppointmentLocationPage from '../../pages/appointments/location.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import { completeAttendancePage, completeSentencePage, completeTypePage, crn, uuid } from './imports'
import AttendancePage from '../../pages/appointments/attendance.page'

const loadPage = () => {
  completeTypePage()
  completeSentencePage()
  completeAttendancePage()
}

describe('Pick a location for this appointment', () => {
  let locationPage: AppointmentLocationPage
  let dateTimePage: AppointmentDateTimePage

  describe('Page is rendered', () => {
    beforeEach(() => {
      loadPage()
      locationPage = new AppointmentLocationPage()
    })
    it('should display the options', () => {
      locationPage.getRadioLabel('location', 1).should('contain.text', 'HMP Wakefield')
      locationPage.getRadioLabel('location', 2).should('contain.text', '102 Petty France')
      locationPage
        .getRadioLabel('location', 4)
        .should('contain.text', 'The location I’m looking for is not in this list')
      locationPage.getRadioLabel('location', 5).should('contain.text', 'I do not need to pick a location')
    })
    it('should display the continue button', () => {
      locationPage.getSubmitBtn().should('contain.text', 'Continue')
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
      locationPage.getElement(`#appointments-${crn}-${uuid}-location-error`).should($error => {
        expect($error.text().trim()).to.include('Select an appointment location')
      })
    })
    it('should focus the first radio button when the summary link is clicked', () => {
      locationPage.getErrorSummaryLink(0).click()
      locationPage.getElement(`#appointments-${crn}-${uuid}-location`).should('be.focused')
    })
  })

  describe('Location is selected, and continue is clicked', () => {
    beforeEach(() => {
      loadPage()
      locationPage.getElement(`#appointments-${crn}-${uuid}-location`).click()
      locationPage.getSubmitBtn().click()
    })
    it('should redirect to the date time page', () => {
      dateTimePage = new AppointmentDateTimePage()
      dateTimePage.checkOnPage()
    })
  })
})
