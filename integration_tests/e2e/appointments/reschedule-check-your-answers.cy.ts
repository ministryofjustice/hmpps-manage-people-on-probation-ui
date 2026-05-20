import { DateTime } from 'luxon'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'
import { checkAppointmentSummary, checkPopHeader } from './imports'
import { dateWithYear, dayOfWeek } from '../../../server/utils'
import { completeRescheduleAppointmentPage, getUuid, completeRescheduling, to24HourTimeWithMinutes } from './utils'
import AttendedFailedToComplyPage from '../../pages/appointmentOutcomes/attended-failed-to-comply.page'
import OutcomePage from '../../pages/appointmentOutcomes/outcome.page'

describe('Change appointment details and reschedule', () => {
  let checkYourAnswerPage: AppointmentCheckYourAnswersPage
  let dateTimePage: AppointmentLocationDateTimePage
  let outcomePage: OutcomePage
  let attendedFailedToComplyPage: AttendedFailedToComplyPage
  const crn = 'X000001'
  const future = DateTime.now().plus({ days: 2 })
  const startTime = '09:10'
  const endTime = '10:30'

  beforeEach(() => {
    cy.task('resetMocks')
  })

  it('should render the page', () => {
    completeRescheduleAppointmentPage({ crn })
    checkYourAnswerPage = new AppointmentCheckYourAnswersPage()
    checkYourAnswerPage.checkPageTitle('Change appointment details and reschedule')
    checkPopHeader()
    cy.get('[data-qa=pageHeading]').should('contain.text', 'Change appointment details and reschedule')
    checkAppointmentSummary({
      page: checkYourAnswerPage,
      reschedule: true,
      probationPractitioner: false,
      sendTextMessage: false,
      summaryHasDate: false,
    })

    cy.get('p')
      .eq(1)
      .should(
        'contain.text',
        'Use the saved details of the previously created appointment to reschedule it. You can amend any of the details.',
      )
    cy.get('[data-qa="calendarInviteInset"]').should(
      'contain.text',
      `You'll receive a calendar invite for the appointment.`,
    )
    cy.get('[data-qa="previousDateTime"]').should('not.exist')
  })

  describe('User clicks submit without selecting a date and time', () => {
    beforeEach(() => {
      completeRescheduleAppointmentPage()
      checkYourAnswerPage = new AppointmentCheckYourAnswersPage()
      checkYourAnswerPage.checkPageTitle('Change appointment details and reschedule')
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
        completeRescheduling({ id: uuid })
        cy.get('[data-qa="previousDateTime"]').should(
          'contain.text',
          `Wednesday 21 February 2024 at 10:15am to 10:30am`,
        )
        checkYourAnswerPage
          .getSummaryListRow(5)
          .find('.govuk-summary-list__value li:nth-child(1)')
          .invoke('text')
          .then(text => {
            const normalizedText = text.replace(/\s+/g, ' ').trim()
            expect(normalizedText).to.include(
              `${dayOfWeek(future.toISODate())} ${dateWithYear(future.toISODate())} at ${to24HourTimeWithMinutes(startTime)} to ${to24HourTimeWithMinutes(endTime)}`,
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

  describe('Reschedule appointment in the past - non compliance enabled', () => {
    beforeEach(() => {
      completeRescheduleAppointmentPage()
      checkYourAnswerPage = new AppointmentCheckYourAnswersPage()
      checkYourAnswerPage.checkPageTitle('Change appointment details and reschedule')
      checkYourAnswerPage.getSubmitBtn().click()
    })
    it('should display the log outcomes alert banner and not display outlook invite text', () => {
      getUuid().then(uuid => {
        completeRescheduling({ id: uuid, inPast: true })
        checkYourAnswerPage
          .getSummaryListRow(6)
          .find('.govuk-summary-list__key')
          .should('contain.text', 'What was the outcome of this appointment?')
        checkYourAnswerPage
          .getSummaryListRow(6)
          .find('.govuk-summary-list__value')
          .should('contain.text', 'Attended - failed to comply')
        checkYourAnswerPage
          .getSummaryListRow(7)
          .find('.govuk-summary-list__key')
          .should('contain.text', 'Enforcement action')
        checkYourAnswerPage
          .getSummaryListRow(7)
          .find('.govuk-summary-list__value')
          .should('contain.text', 'No further action')
        checkYourAnswerPage
          .getSummaryListRow(8)
          .find('.govuk-summary-list__key')
          .should('contain.text', 'Evidence due date')
        const evidenceDate = DateTime.now().plus({ days: 6 }).toFormat('dd MMMM yyyy')
        checkYourAnswerPage.getSummaryListRow(8).find('.govuk-summary-list__value').should('contain.text', evidenceDate)
        cy.get('[data-qa="calendarInviteInset"]').should('not.exist')
      })
    })
    it('should redirect to the outcome page when change link is clicked', () => {
      getUuid().then(uuid => {
        completeRescheduling({ id: uuid, inPast: true })
        checkYourAnswerPage.getSummaryListRow(6).find('.govuk-summary-list__actions').find('a').click()
        outcomePage = new OutcomePage()
      })
    })
    it('should redirect to the correct enforcement page when change link is clicked', () => {
      getUuid().then(uuid => {
        completeRescheduling({ id: uuid, inPast: true })
        checkYourAnswerPage.getSummaryListRow(7).find('.govuk-summary-list__actions').find('a').click()
        attendedFailedToComplyPage = new AttendedFailedToComplyPage()
        cy.get(`.govuk-radios__input[value=NO_FURTHER_ACTION]`).should('be.checked')
      })
    })
    it('should redirect to the correct enforcement page when evidence due date change link is clicked', () => {
      getUuid().then(uuid => {
        completeRescheduling({ id: uuid, inPast: true })
        checkYourAnswerPage.getSummaryListRow(8).find('.govuk-summary-list__actions').find('a').click()
        attendedFailedToComplyPage = new AttendedFailedToComplyPage()
        cy.get(`.govuk-radios__input[value=NO_FURTHER_ACTION]`).should('be.checked')
      })
    })
  })

  describe('Reschedule appointment in the past - non compliance disabled', () => {
    beforeEach(() => {
      completeRescheduleAppointmentPage({ enableNonCompliance: false })
      checkYourAnswerPage = new AppointmentCheckYourAnswersPage()
      checkYourAnswerPage.checkPageTitle('Change appointment details and reschedule')
      checkYourAnswerPage.getSubmitBtn().click()
    })
    it('should display the log outcomes alert banner and not display outlook invite text', () => {
      getUuid().then(uuid => {
        completeRescheduling({ id: uuid, inPast: true, enableNonCompliance: false })
        checkYourAnswerPage
          .getSummaryListRow(6)
          .find('.govuk-summary-list__key')
          .should('contain.text', 'Attended and complied')
        checkYourAnswerPage.getSummaryListRow(6).find('.govuk-summary-list__value').should('contain.text', 'Yes')
        checkYourAnswerPage.getSummaryListRow(7).find('.govuk-summary-list__key').should('contain.text', 'Notes')
        checkYourAnswerPage
          .getSummaryListRow(7)
          .find('.govuk-summary-list__value')
          .should('contain.text', 'Not entered')
        checkYourAnswerPage.getSummaryListRow(8).find('.govuk-summary-list__key').should('contain.text', 'Sensitivity')
        checkYourAnswerPage.getSummaryListRow(8).find('.govuk-summary-list__value').should('contain.text', 'No')
        cy.get('[data-qa="calendarInviteInset"]').should('not.exist')
      })
    })
  })
})
