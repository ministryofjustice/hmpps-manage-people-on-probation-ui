import { DateTime } from 'luxon'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'
import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'
import {
  checkAppointmentSummary,
  checkPopHeader,
  getUuid,
  to24HourTimeWithMinutes,
  completeRescheduling,
  completeRescheduleAppointmentPage,
} from './imports'
import { dateWithYear, dayOfWeek } from '../../../server/utils'

describe('Change appointment details and reschedule', () => {
  let checkYourAnswerPage: RescheduleCheckYourAnswerPage
  let dateTimePage: AppointmentLocationDateTimePage
  const crn = 'X000001'
  const tomorrow = DateTime.now().plus({ days: 1 })
  const startTime = '09:10'
  const endTime = '10:30'

  it('should render the page', () => {
    completeRescheduleAppointmentPage()
    checkYourAnswerPage = new RescheduleCheckYourAnswerPage()
    checkPopHeader()
    cy.get('[data-qa=pageHeading]').should('contain.text', 'Change appointment details and reschedule')
    checkAppointmentSummary(checkYourAnswerPage)
    cy.get('[data-qa="calendarInviteInset"]').should(
      'contain.text',
      `You'll receive a calendar invite for the appointment.`,
    )
    cy.get('[data-qa="previousDateTime"]').should('not.exist')
  })

  describe('User clicks submit without selecting a date and time', () => {
    beforeEach(() => {
      completeRescheduleAppointmentPage()
      checkYourAnswerPage = new RescheduleCheckYourAnswerPage()
      checkYourAnswerPage.getSubmitBtn().click()
    })

    it('should redirect to the date/time page', () => {
      dateTimePage = new AppointmentLocationDateTimePage()
      dateTimePage.checkOnPage()
    })
    it('should display the error summary box', () => {
      dateTimePage.checkErrorSummaryBox(['Enter or select a date', 'Enter a start time', 'Enter an end time'])

      it('should display the error messages', () => {
        getUuid().then(uuid => {
          dateTimePage.getElement(`#appointments-${crn}-${uuid}-date-error`).should($error => {
            expect($error.text().trim()).to.include('Enter or select a date')
          })
          dateTimePage.getElement(`#appointments-${crn}-${uuid}-start-error`).should($error => {
            expect($error.text().trim()).to.include('Enter a start time')
          })
          dateTimePage.getElement(`#appointments-${crn}-${uuid}-end-error`).should($error => {
            expect($error.text().trim()).to.include('Enter an end time')
          })
        })
      })
    })
    it('should display the previous appointment date and outlook invite', () => {
      getUuid().then(uuid => {
        completeRescheduling(uuid)
        cy.get('[data-qa="previousDateTime"]').should(
          'contain.text',
          `Wednesday 21 February 2024 at 12:15am to 12:30am`,
        )
        checkYourAnswerPage
          .getSummaryListRow(5)
          .find('.govuk-summary-list__value li:nth-child(1)')
          .invoke('text')
          .then(text => {
            const normalizedText = text.replace(/\s+/g, ' ').trim()
            expect(normalizedText).to.include(
              `${dayOfWeek(tomorrow.toISODate())} ${dateWithYear(tomorrow.toISODate())} at ${to24HourTimeWithMinutes(startTime)} to ${to24HourTimeWithMinutes(endTime)}`,
            )
          })
        cy.get('[data-qa="calendarInviteInset"]').should('be.visible')
        cy.get('[data-qa="calendarInviteInset"]').should(
          'contain.text',
          `You'll receive an updated calendar invite for the appointment.`,
        )
      })
    })
  })

  describe('Reschedule appointment in the past', () => {
    beforeEach(() => {
      completeRescheduleAppointmentPage()
      checkYourAnswerPage = new RescheduleCheckYourAnswerPage()
      checkYourAnswerPage.getSubmitBtn().click()
    })
    it('should display the log outcomes alert banner and not display outlook invite text', () => {
      getUuid().then(uuid => {
        completeRescheduling(uuid, true)
        cy.get('[data-qa="calendarInviteInset"]').should('not.exist')
      })
    })
  })
})
