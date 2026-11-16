import { DateTime } from 'luxon'
import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import TextMessageConfirmationPage from '../../pages/appointments/text-message-confirmation.page'
import { crn, uuid } from './imports/common'
import { completeSentencePage, completeTypePage, completeRescheduleAppointmentPage, getUuid } from './utils'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'
import OutcomePage from '../../pages/appointmentOutcomes/outcome.page'

const loadPage = ({ urlCRN = crn, typeOptionIndex = 1 } = {}) => {
  completeSentencePage({ eventIndex: 1, crnOverride: urlCRN })
  completeTypePage(typeOptionIndex)
}

// Mocks the time in both the server (used by the date and time validation) and the browser
const mockTime = (iso: string) => {
  const mockedNow = DateTime.fromISO(iso, { zone: 'Europe/London' })
  cy.request({
    method: 'POST',
    url: 'http://localhost:3007/__test/set-mocked-time',
    body: { time: mockedNow.toUTC().toISO() },
  })
  cy.clock(mockedNow.toMillis(), ['Date'])
  return mockedNow
}

// Routing to the outcome or text message page uses the real clock, so the journeys derive their date from today
const todayAt0901 = () =>
  DateTime.now()
    .setZone('Europe/London')
    .set({ hour: 9, minute: 1, second: 0, millisecond: 0 })
    .toFormat("yyyy-MM-dd'T'HH:mm:ss")

describe('Pick a date, location and time for this appointment', () => {
  let locationDateTimePage: AppointmentLocationDateTimePage

  const locationRadio = `#appointments-${crn}-${uuid}-user-locationCode`

  beforeEach(() => {
    cy.task('resetMocks')
  })

  // Don't leave a mocked time behind for other specs
  after(() => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:3007/__test/set-mocked-time',
      body: { time: DateTime.now().toUTC().toISO() },
    })
  })

  // The pop header, risk to staff alert, no locations redirect, SMS consent link and SMS/flag branches
  // are covered by the sentence, location-not-in-list, supporting-information, text-message-confirmation
  // and check-your-answers specs. Content, warnings and error rendering are covered by
  // location-date-time.njk.test.ts
  describe('Journey: arrange an appointment through the location, date and time page', () => {
    it('should navigate back, validate the form, show the warnings, then continue to the text message confirmation page', () => {
      // Today (London) at 09:01, so the future date used below stays in the future for the real-clock routing
      const now = mockTime(todayAt0901())
      loadPage()
      locationDateTimePage = new AppointmentLocationDateTimePage()

      // Step 1: the back link returns to the appointment type page
      locationDateTimePage.getBackLink().click()
      new AppointmentTypePage().checkOnPage()
      completeTypePage(1)
      locationDateTimePage = new AppointmentLocationDateTimePage()
      locationDateTimePage.checkOnPage()

      // Step 2: submitting an empty form displays every error and the summary link focuses the location
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.checkErrorSummaryBox([
        'Enter or select a date',
        'Enter a start time',
        'Enter an end time',
        'Select an appointment location',
      ])
      locationDateTimePage.getErrorSummaryLink(3).click()
      locationDateTimePage.getElement(locationRadio).should('be.focused')

      // Step 3: selecting today from the picker populates the date field, an end time before the start time is rejected
      locationDateTimePage.getElement(locationRadio).click()
      locationDateTimePage.getDatePickerInput().clear()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getDatePickerInput().should('have.value', now.toFormat('d/M/yyyy'))
      locationDateTimePage.getElementInput(`startTime`).clear().type('09:10')
      locationDateTimePage.getElementInput(`endTime`).focus().clear().type('08:30')
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.checkErrorSummaryBox(['The end time must be after the start time'])
      locationDateTimePage.getBackLink().should('be.visible')

      // Step 4: a valid future date and time displays the warnings
      locationDateTimePage.getElement(locationRadio).click()
      locationDateTimePage
        .getDatePickerInput()
        .clear()
        .type(now.plus({ days: 2 }).toFormat('d/M/yyyy'))
      locationDateTimePage.getElementInput(`startTime`).clear().type('09:00')
      locationDateTimePage.getElementInput(`endTime`).focus().clear().type('09:30')
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage
        .getWarning('isWithinOneHourOfMeetingWith')
        .should(
          'contain.text',
          'Alma Barlow already has an appointment with Alton within an hour of this date and time. Continue with these details or make changes.',
        )
      locationDateTimePage
        .getWarning('nonWorkingDayName')
        .should(
          'contain.text',
          'You have selected a non-working day (Sunday). Continue with these details or make changes.',
        )

      // Step 5: continuing with the warnings displayed redirects to the text message confirmation page
      locationDateTimePage.getSubmitBtn().click()
      new TextMessageConfirmationPage().checkOnPage()
    })
  })

  describe('Journey: arrange an appointment that clashes with an existing appointment', () => {
    it('should display the overlapping appointment warning', () => {
      // Today (London) at 09:01
      mockTime(todayAt0901())
      cy.task('stubAppointmentClash')
      loadPage()
      locationDateTimePage = new AppointmentLocationDateTimePage()
      locationDateTimePage.getElement(locationRadio).click()
      locationDateTimePage.getDatePickerToggle().click()
      locationDateTimePage.getActiveDayButton().click()
      locationDateTimePage.getElementInput(`startTime`).clear().type('11:00')
      locationDateTimePage.getElementInput(`endTime`).focus().clear().type('11:15')
      locationDateTimePage.getSubmitBtn().click()
      cy.get('[data-qa=overlapsWithMeetingWith]')
        .should('be.visible')
        .should(
          'contain.text',
          'Alton has an existing appointment at 11am to 12pm that overlaps with this time. Continue with these details or make changes',
        )
    })
  })

  describe('Journey: reschedule an appointment', () => {
    it('should reject the original date and times, then submit when the date is changed', () => {
      // Friday 1 March 2024, 09:00: the original and the new appointment dates are both in the past
      mockTime('2024-03-01T09:00:00')
      const urlCRN = 'X000001'
      const originalAppointmentError =
        'The original appointment was also arranged for 10:15am on Wednesday 21 February. If the original date is'

      completeRescheduleAppointmentPage()
      new RescheduleCheckYourAnswerPage().getSubmitBtn().click()
      locationDateTimePage = new AppointmentLocationDateTimePage()

      // Step 1: the same date, start and end time as the original appointment are rejected
      locationDateTimePage.getDatePickerInput().clear().type('21/2/2024')
      locationDateTimePage.getElementInput(`startTime`).clear().type('10:15')
      locationDateTimePage.getElementInput(`endTime`).focus().clear().type('10:30')
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.checkErrorSummaryBox([
        `${originalAppointmentError} incorrect, select a new date.`,
        `${originalAppointmentError} correct, select a new start time.`,
        `${originalAppointmentError} correct, select a new end time.`,
      ])
      getUuid().then(urlUUID => {
        locationDateTimePage
          .getElement(`#appointments-${urlCRN}-${urlUUID}-date-error`)
          .should('contain.text', `${originalAppointmentError} incorrect, select a new date.`)
        locationDateTimePage
          .getElement(`#appointments-${urlCRN}-${urlUUID}-start-error`)
          .should('contain.text', `${originalAppointmentError} correct, select a new start time.`)
        locationDateTimePage
          .getElement(`#appointments-${urlCRN}-${urlUUID}-end-error`)
          .should('contain.text', `${originalAppointmentError} correct, select a new end time.`)
      })

      // Step 2: changing the date allows the page to be submitted
      locationDateTimePage.getDatePickerInput().clear().type('22/1/2024')
      locationDateTimePage.getSubmitBtn().click()
      locationDateTimePage.getSubmitBtn().click()
      new OutcomePage().checkPageTitle('What was the outcome of this appointment?')
    })
  })
})
