import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import AppointmentDateTimePage from '../../pages/appointments/date-time.page'
import {
  completeTypePage,
  completeSentencePage,
  completeAttendancePage,
  completeLocationPage,
  completeDateTimePage,
  completeRepeatingPage,
  completeNotePage,
  completeCYAPage,
  completeConfirmationPage,
  checkAppointmentSummary,
  crn,
  getUuid,
  checkUpdateType,
  checkUpdateSentence,
  checkUpdateLocation,
  checkUpdateDateTime,
  checkUpdateRepeating,
  checkUpdateNotes,
  checkUpdateSensitivity,
} from './imports'

const loadPage = () => {
  completeSentencePage()
  completeTypePage()
  completeAttendancePage()
  completeLocationPage()
  completeDateTimePage()
  completeRepeatingPage()
  completeNotePage()
  completeCYAPage()
  completeConfirmationPage()
}

describe('Arrange another appointment', () => {
  it('should render the page', () => {
    loadPage()
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    checkAppointmentSummary(arrangeAnotherAppointmentPage)
    arrangeAnotherAppointmentPage.getSubmitBtn().should('include.text', 'Arrange appointment')
  })
  describe('User clicks submit without selecting a date and time', () => {
    let dateTimePage: AppointmentDateTimePage
    let arrangeAnotherAppointmentPage: ArrangeAnotherAppointmentPage
    beforeEach(() => {
      loadPage()
      arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
      arrangeAnotherAppointmentPage.getSubmitBtn().click()
    })

    it('should redirect to the date/time page', () => {
      dateTimePage = new AppointmentDateTimePage()
      dateTimePage.checkOnPage()
    })
    it('should display the error summary box', () => {
      dateTimePage.checkErrorSummaryBox(['Enter or select a date', 'Select a start time', 'Select an end time'])
    })
    it('should display the error messages', () => {
      getUuid().then(uuid => {
        dateTimePage.getElement(`#appointments-${crn}-${uuid}-date-error`).should($error => {
          expect($error.text().trim()).to.include('Enter or select a date')
        })
        dateTimePage.getElement(`#appointments-${crn}-${uuid}-start-error`).should($error => {
          expect($error.text().trim()).to.include('Select a start time')
        })
        dateTimePage.getElement(`#appointments-${crn}-${uuid}-end-error`).should($error => {
          expect($error.text().trim()).to.include('Select an end time')
        })
      })
    })
  })

  describe('Change appointment values', () => {
    let arrangeAnotherAppointmentPage: ArrangeAnotherAppointmentPage
    beforeEach(() => {
      loadPage()
      arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    })
    it('should update the type when value is changed', () => {
      checkUpdateType(arrangeAnotherAppointmentPage)
    })
    it('should update the sentence when value is changed', () => {
      checkUpdateSentence(arrangeAnotherAppointmentPage)
    })
    it('should update the location when value is changed', () => {
      checkUpdateLocation(arrangeAnotherAppointmentPage)
    })
    it('should update the date when value is changed', () => {
      checkUpdateDateTime(arrangeAnotherAppointmentPage)
    })
    it('should update the repeat appointment when value is changed', () => {
      checkUpdateRepeating(arrangeAnotherAppointmentPage)
    })
    it('should update the notes when value is changed', () => {
      checkUpdateNotes(arrangeAnotherAppointmentPage)
    })
    it('should update the sensitivity when value is changed', () => {
      checkUpdateSensitivity(arrangeAnotherAppointmentPage)
    })
  })

  describe('Practitioner submits the appointment', () => {
    let confirmPage: AppointmentConfirmationPage
    beforeEach(() => {
      loadPage()
    })
    it('should redirect to the confirmation page', () => {
      getUuid().then(uuid => {
        const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
        checkUpdateDateTime(arrangeAnotherAppointmentPage)
        arrangeAnotherAppointmentPage.getSubmitBtn().click()
        confirmPage = new AppointmentConfirmationPage()
        confirmPage.checkOnPage()
      })
    })
  })
})
