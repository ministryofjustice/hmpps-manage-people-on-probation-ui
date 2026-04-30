import { DateTime } from 'luxon'
import { checkPopHeader } from '../appointments/imports'
import { crn, appointmentId } from '../appointments/imports/common'
import AttendedFailedToComplyPage from '../../pages/appointmentOutcomes/attended-failed-to-comply.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import OutcomePage from '../../pages/appointmentOutcomes/outcome.page'
import {
  completeSentencePage,
  completeTypePage,
  completeLocationDateTimePage,
  completeRescheduleAppointmentPage,
  getUuid,
} from '../appointments/utils'
import AddNotePage from '../../pages/appointments/add-note.page'
import AcceptableAbsencePage from '../../pages/appointmentOutcomes/acceptable-absence.page'
import FailedToAttendPage from '../../pages/appointmentOutcomes/failed-to-attend.page'
import UnacceptableAbsencePage from '../../pages/appointmentOutcomes/unacceptable-absence.page'
import AttendedCompliedPage from '../../pages/appointments/attended-complied.page'
import RescheduleAppointmentPage from '../../pages/appointments/reschedule-appointment.page'
import { ExpectedOption, Journey, checkOptionRedirectsToCorrectPage, checkOptions } from './imports'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'

let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage
let checkYourAnswersPage: RescheduleCheckYourAnswerPage

type RedirectPages =
  | AttendedCompliedPage
  | AttendedFailedToComplyPage
  | AcceptableAbsencePage
  | UnacceptableAbsencePage
  | FailedToAttendPage
  | AddNotePage

interface Args {
  journey?: Journey
  dateInPast?: boolean
  inOffice?: boolean
  id?: string
}

const loadPage = ({ journey = 'MANAGE', dateInPast = false, inOffice = true, id = appointmentId }: Args = {}) => {
  cy.task('stubEnableNonCompliance')
  cy.task('stubAppointment', { isFuture: dateInPast === false, eventId: 2501192724, inOffice })
  cy.request({
    method: 'POST',
    url: 'http://localhost:3007/__test/clear-session',
  })
  if (journey === 'ARRANGE') {
    completeSentencePage()
    completeTypePage(inOffice ? 1 : 2)
    completeLocationDateTimePage({ dateInPast })
  }
  if (journey === 'MANAGE') {
    cy.visit(`/case/${crn}/appointments/appointment/${id}/manage`)
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getTaskLink(1).click()
  }
  if (journey === 'RESCHEDULE') {
    completeRescheduleAppointmentPage(true, crn)
    checkYourAnswersPage = new RescheduleCheckYourAnswerPage()
    checkYourAnswersPage.getSubmitBtn().click()
    getUuid(2).then(pageUuid => {
      completeLocationDateTimePage({ dateInPast: true, uuidOveride: pageUuid })
    })
  }
}

const getExpectedOptions = ({ inOffice = true, dateInPast = true }): ExpectedOption<RedirectPages>[] => {
  const options: ExpectedOption<RedirectPages>[] = []
  if (dateInPast) {
    options.push(
      {
        value: 'ATTENDED_COMPLIED',
        text: 'Attended - complied',
        redirectPageName: 'Add a note',
        redirectPageTitle: 'Add a note',
        RedirectPage: AddNotePage,
      },
      {
        value: 'ATTENDED_FAILED_TO_COMPLY',
        text: 'Attended - failed to comply',
        hint: 'For example, their behaviour was disruptive or they did not follow instructions.',
        redirectPageName: 'Attended failed to comply',
        redirectPageTitle: 'Enforcement action for Alton’s failure to comply',
        RedirectPage: AttendedFailedToComplyPage,
      },
    )
    if (inOffice) {
      options.push(
        {
          value: 'ATTENDED_SENT_HOME_BEHAVIOUR',
          text: 'Attended - sent home (behaviour)',
          redirectPageName: 'Attended failed to comply',
          redirectPageTitle: 'Enforcement action for Alton’s failure to comply',
          RedirectPage: AttendedFailedToComplyPage,
        },
        {
          value: 'ATTENDED_SENT_HOME_SERVICE_ISSUES',
          text: 'Attended - sent home (service issues)',
          redirectPageName: 'Attended failed to comply',
          redirectPageTitle: 'Enforcement action for Alton’s failure to comply',
          RedirectPage: AttendedFailedToComplyPage,
        },
      )
    }
  }
  options.push({
    value: 'ACCEPTABLE_ABSENCE',
    text: 'Acceptable absence',
    hint: 'They provided an acceptable reason or evidence.',
    redirectPageName: 'Acceptable absence',
    redirectPageTitle: 'Why was Alton’s absence acceptable?',
    RedirectPage: AcceptableAbsencePage,
  })
  if (dateInPast) {
    options.push(
      {
        value: 'UNACCEPTABLE_ABSENCE',
        text: 'Unacceptable absence',
        hint: 'They did not provide suitable evidence.',
        redirectPageName: 'Unacceptable absence',
        redirectPageTitle: 'Enforcement action for Alton’s unacceptable absence',
        RedirectPage: UnacceptableAbsencePage,
      },
      {
        value: 'FAILED_TO_ATTEND',
        text: 'Failed to attend',
        hint: 'You may still need to request and review evidence.',
        redirectPageName: 'Failed to attend',
        redirectPageTitle: 'Enforcement action for Alton’s absence',
        RedirectPage: FailedToAttendPage,
      },
    )
  }
  if (!dateInPast) {
    options.push({
      value: 'WILL_BE_RESCHEDULED',
      text: 'The appointment will be rescheduled',
      redirectPageName: 'Reschedule an appointment',
      redirectPageTitle: 'Reschedule an appointment',
      RedirectPage: RescheduleAppointmentPage,
    })
  }
  return options
}

const checkValidationErrors = ({
  journey = 'MANAGE',
  inOffice = true,
  dateInPast = true,
}: { journey?: Journey; inOffice?: boolean; dateInPast?: boolean } = {}): void => {
  const msg = dateInPast ? 'Select an outcome for this appointment' : 'Select why they will not attend this appointment'
  loadPage({ journey, inOffice, dateInPast })
  outcomePage = new OutcomePage()
  outcomePage.getSubmitBtn().click()
  outcomePage.checkErrorSummaryBox([msg])
  getUuid(2).then(pageUuid => {
    const id = journey === 'MANAGE' ? appointmentId : pageUuid
    cy.get(`#appointments-${crn}-${id}-outcome-outcomeType-error`).should('contain.text', msg)
  })
}

const checkPageTitle = ({
  journey = 'MANAGE',
  inOffice = true,
  dateInPast = true,
}: { journey?: Journey; inOffice?: boolean; dateInPast?: boolean } = {}): void => {
  const now = DateTime.now()
  const pastDate = now.minus({ days: 1 }).toFormat('cccc d MMMM yyyy')
  const futureDate = now.plus({ days: 1 }).toFormat('cccc d MMMM yyyy')
  getUuid(2).then(pageUuid => {
    const id = journey === 'MANAGE' ? appointmentId : pageUuid
    let appointmentDate = journey === 'MANAGE' ? 'Wednesday 21 February 2024' : pastDate
    let meetingType = ['MANAGE', 'RESCHEDULE'].includes(journey) ? '3 Way Meeting (NS)' : 'Planned Office Visit (NS)'
    if (!inOffice) {
      meetingType = 'Planned Telephone Contact (NS)'
    }
    const officer = journey === 'ARRANGE' ? 'Deborah Fern' : 'Terry Jones'
    const h2Title = dateInPast
      ? 'What was the outcome of this appointment?'
      : 'Why will Alton not attend this appointment?'
    if (!dateInPast) {
      appointmentDate = futureDate
    }
    outcomePage = new OutcomePage()
    outcomePage.checkPageTitle(h2Title)
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
    cy.get(`#appointments-${crn}-${id}-outcome-outcomeType-hint`).should(
      'contain.text',
      `Appointment: ${meetingType} with ${officer} on ${appointmentDate}.`,
    )
  })
}

const checkPage = ({ journey = 'MANAGE' }: { journey?: Journey } = {}) => {
  it('should render the page if appointment is in the past and in office', () => {
    loadPage({ journey, inOffice: true, dateInPast: true })
    outcomePage = new OutcomePage()
    const options = getExpectedOptions({ inOffice: true, dateInPast: true })
    checkPageTitle({ journey, inOffice: true, dateInPast: true })
    checkOptions(options)
    checkValidationErrors({ journey, inOffice: true, dateInPast: true })
    checkOptionRedirectsToCorrectPage(options, loadPage, {
      Page: OutcomePage,
      journey,
      inOffice: true,
      dateInPast: true,
    })
  })
  it('should render the page if appointment is in the past and not in office', () => {
    loadPage({ journey, inOffice: false, dateInPast: true })
    const options = getExpectedOptions({ inOffice: false, dateInPast: true })
    checkPageTitle({ journey, inOffice: false, dateInPast: true })
    checkOptions(options)
    checkOptionRedirectsToCorrectPage(options, loadPage, {
      Page: OutcomePage,
      journey,
      inOffice: false,
      dateInPast: true,
    })
  })
  if (journey === 'MANAGE') {
    it('should render the page if appointment is in the future', () => {
      loadPage({ dateInPast: false })
      const options = getExpectedOptions({ dateInPast: false })
      checkPageTitle({ journey, dateInPast: false })
      checkOptions(options)
      checkValidationErrors({ journey, inOffice: true, dateInPast: false })
      checkOptionRedirectsToCorrectPage(options, loadPage, {
        Page: OutcomePage,
        journey,
        inOffice: true,
        dateInPast: false,
      })
    })
  }
  it('should have the correct back link', () => {
    loadPage({ journey, inOffice: true, dateInPast: true })
    let expectedLink: string
    getUuid(2).then(pageUuid => {
      if (journey === 'MANAGE') {
        expectedLink = `/case/${crn}/appointments/appointment/${appointmentId}/manage`
      } else {
        expectedLink = `/case/${crn}/arrange-appointment/${pageUuid}/location-date-time`
      }
      outcomePage.getBackLink().should('have.attr', 'href', expectedLink)
    })
  })
}

describe('Appointment outcome', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })
  describe('Manage appointment journey', () => {
    checkPage()
  })
  describe('Arrange appointment journey', () => {
    checkPage({ journey: 'ARRANGE' })
  })
  describe('Reschedule appointment journey', () => {
    checkPage({ journey: 'RESCHEDULE' })
  })
})
