import { DateTime } from 'luxon'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import RescheduleAppointmentPage from '../../pages/appointments/reschedule-appointment.page'
import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'
import SupportingInformationPage from '../../pages/appointments/note.page'
import { checkAppointmentSummary, checkPopHeader, getUuid, to24HourTimeWithMinutes } from './imports'
import { dateWithYear, dayOfWeek } from '../../../server/utils'

describe('Change appointment details and reschedule', () => {
  let manageAppointmentPage: ManageAppointmentPage
  let rescheduleAppointmentPage: RescheduleAppointmentPage
  let checkYourAnswerPage: RescheduleCheckYourAnswerPage
  const crn = 'X000001'
  const loadPage = (): void => {
    cy.visit('/case/X000001/appointments/appointment/6/manage')
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getAppointmentDetailsListItem(1, 'actions').find('a').click()
    rescheduleAppointmentPage = new RescheduleAppointmentPage()
    rescheduleAppointmentPage
      .getWhoNeedsToReschedule()
      .find('.govuk-radios__item')
      .eq(0)
      .find('.govuk-radios__input')
      .click()
    rescheduleAppointmentPage.getSubmitBtn().click()
  }

  it('should render the page', () => {
    loadPage()
    checkYourAnswerPage = new RescheduleCheckYourAnswerPage()
    checkPopHeader()
    cy.get('[data-qa=pageHeading]').should('contain.text', 'Change appointment details and reschedule')
    checkAppointmentSummary(checkYourAnswerPage)
    cy.get('[data-qa="previousDateTime"]').should('not.exist')
  })

  describe('User clicks submit without selecting a date and time', () => {
    let dateTimePage: AppointmentLocationDateTimePage
    let supportingInformationPage: SupportingInformationPage
    beforeEach(() => {
      loadPage()
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
    it('should display the previous appointment date', () => {
      getUuid().then(uuid => {
        const tomorrow = DateTime.now().plus({ days: 1 })
        const startTime = '09:10'
        const endTime = '10:30'
        dateTimePage.getDatePickerInput().clear().type(tomorrow.toFormat('d/M/yyyy'))
        dateTimePage.getElementInput(`startTime`).type(startTime)
        dateTimePage.getElementInput(`endTime`).focus().type(endTime)
        dateTimePage.getSubmitBtn().click()
        dateTimePage.getSubmitBtn().click()
        supportingInformationPage = new SupportingInformationPage()
        cy.get(`#appointments-${crn}-${uuid}-sensitivity-2`).click()
        supportingInformationPage.getSubmitBtn().click()
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
      })
    })
  })
})
