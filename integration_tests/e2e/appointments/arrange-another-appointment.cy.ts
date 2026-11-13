import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import AppointmentdateTimePage from '../../pages/appointments/location-date-time.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import { checkUpdateLocation, checkUpdateDateTime, checkUpdateBackLinkRefresh } from './imports'
import { crn } from './imports/common'
import {
  getUuid,
  completeLocationDateTimePage,
  completeTextMessageConfirmationPage,
  completeSupportingInformationPage,
} from './utils'

const loadPage = ({ _crn = crn }: { _crn?: string } = {}) => {
  cy.visit(`/case/${_crn}/appointments/appointment/6/next-appointment`)
  const nextAppointmentPage = new NextAppointmentPage()
  nextAppointmentPage.getRadio('anotherAppointment', 1).click()
  nextAppointmentPage.getSubmitBtn().click()
}

// Logs a named step (Given / When / Then / And) in the Cypress command log, so a failure shows which step it was
const step = (name: string, fn: () => void) => {
  cy.log(`**${name}**`)
  fn()
}

const checkFieldError = (page: AppointmentdateTimePage | AppointmentSentencePage, selector: string, message: string) =>
  page.getElement(selector).should($error => {
    expect($error.text().trim()).to.include(message)
  })

describe('Arrange another appointment', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })

  it('validates, amends and submits the appointment', () => {
    cy.task('stubNextAppointment')
    loadPage()
    const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
    const dateTimePage = new AppointmentdateTimePage()

    step('Given I have not entered a date and time, when I submit, then I am sent to the date/time page', () => {
      arrangeAnotherAppointmentPage.getSubmitBtn().click()
      dateTimePage.checkOnPage()
    })

    step('And the error summary and field errors are displayed', () => {
      dateTimePage.checkErrorSummaryBox(['Enter or select a date', 'Enter a start time', 'Enter an end time'])
      getUuid().then(uuid => {
        checkFieldError(dateTimePage, `#appointments-${crn}-${uuid}-date-error`, 'Enter or select a date')
        checkFieldError(dateTimePage, `#appointments-${crn}-${uuid}-start-error`, 'Enter a start time')
        checkFieldError(dateTimePage, `#appointments-${crn}-${uuid}-end-error`, 'Enter an end time')
      })
    })

    step('When I enter the location, date, time, text message and notes, then I return to the summary', () => {
      getUuid().then(uuid => {
        completeLocationDateTimePage({ index: 1, uuidOveride: uuid })
        completeTextMessageConfirmationPage({ _crn: crn, _uuid: uuid, index: 1 })
        completeSupportingInformationPage({ notes: true, uuidOveride: uuid })
      })
      arrangeAnotherAppointmentPage.checkOnPage()
    })

    step('And the calendar invite inset text is displayed', () => {
      cy.get('[data-qa="calendarInviteInset"]').should(
        'contain.text',
        `You'll receive a calendar invite for the appointment.`,
      )
    })

    step('And validation errors on change pages do not reset the back link', () => {
      checkUpdateBackLinkRefresh(arrangeAnotherAppointmentPage)
    })

    step('When I change the location, then the summary shows the new location', () => {
      checkUpdateLocation(arrangeAnotherAppointmentPage)
    })

    step('And I change the date, then the summary shows the new date', () => {
      checkUpdateDateTime({ page: arrangeAnotherAppointmentPage })
    })

    step('Then I submit and the appointment is arranged', () => {
      arrangeAnotherAppointmentPage.getSubmitBtn().click()
      new AppointmentConfirmationPage().checkPageTitle('Appointment arranged')
    })
  })

  it('shows sentence validation errors when no sentence or person is selected', () => {
    cy.task('stubAppointmentNoEventId')
    loadPage({ _crn: 'X000001' })

    step('Given no sentence or person is selected, when I submit, then I am sent to the sentence page', () => {
      new ArrangeAnotherAppointmentPage().getSubmitBtn().click()
      new AppointmentSentencePage().checkOnPage()
    })

    step('And the error summary and field error are displayed', () => {
      const sentencePage = new AppointmentSentencePage()
      sentencePage.checkErrorSummaryBox(['Select what this appointment is for'])
      getUuid().then(uuid => {
        checkFieldError(
          sentencePage,
          `#appointments-X000001-${uuid}-eventId-error`,
          'Select what this appointment is for',
        )
      })
    })
  })

  it('shows location validation errors when no location is selected', () => {
    cy.task('stubAppointmentNoLocation')
    loadPage({ _crn: 'X000001' })
    const locationPage = new AppointmentdateTimePage()

    step('Given no location is selected, when I submit, then I am sent to the location page', () => {
      new ArrangeAnotherAppointmentPage().getSubmitBtn().click()
      locationPage.checkOnPage()
    })

    step('And the error summary is displayed', () => {
      locationPage.checkErrorSummaryBox([
        'Enter or select a date',
        'Enter a start time',
        'Enter an end time',
        'Select an appointment location',
      ])
    })

    step('And the field errors are displayed', () => {
      getUuid().then(uuid => {
        checkFieldError(locationPage, `#appointments-X000001-${uuid}-date-error`, 'Enter or select a date')
        checkFieldError(locationPage, `#appointments-X000001-${uuid}-start-error`, 'Enter a start time')
        checkFieldError(locationPage, `#appointments-X000001-${uuid}-end-error`, 'Enter an end time')
        checkFieldError(
          locationPage,
          `#appointments-X000001-${uuid}-user-locationCode-error`,
          'Select an appointment location',
        )
      })
    })
  })

  it('shows the outcome and action when the date is changed to the past', () => {
    cy.task('stubNextAppointment')
    loadPage()
    step(
      'Given I am arranging another appointment, when I change the date to the past, then the outcome is shown',
      () => {
        checkUpdateDateTime({ page: new ArrangeAnotherAppointmentPage(), inPast: true })
      },
    )
  })
})
