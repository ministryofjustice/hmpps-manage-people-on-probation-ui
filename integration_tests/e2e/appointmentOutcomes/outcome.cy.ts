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
  uncheckAllRadios,
} from '../appointments/utils'
import AddNotePage from '../../pages/appointments/add-note.page'
import AcceptableAbsencePage from '../../pages/appointmentOutcomes/acceptable-absence.page'
import FailedToAttendPage from '../../pages/appointmentOutcomes/failed-to-attend.page'
import UnacceptableAbsencePage from '../../pages/appointmentOutcomes/unacceptable-absence.page'
import AttendedCompliedPage from '../../pages/appointments/attended-complied.page'
import RescheduleAppointmentPage from '../../pages/appointments/reschedule-appointment.page'
import { ExpectedOption, Journey, checkOptionRedirects } from './imports'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'
import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'

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
  cy.task('stubAppointment', { isFuture: dateInPast === false, eventId: 2501192724, inOffice })
  if (journey === 'ARRANGE') {
    completeSentencePage()
    completeTypePage(inOffice ? 1 : 2)
    completeLocationDateTimePage({ dateInPast })
    uncheckAllRadios()
  }
  if (journey === 'MANAGE') {
    cy.visit(`/case/${crn}/appointments/appointment/${id}/manage`)
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getTaskLink(1).click()
    uncheckAllRadios()
  }
  if (journey === 'RESCHEDULE') {
    completeRescheduleAppointmentPage({ crn })
    checkYourAnswersPage = new RescheduleCheckYourAnswerPage()
    checkYourAnswersPage.getSubmitBtn().click()
    getUuid(2).then(pageUuid => {
      completeLocationDateTimePage({ dateInPast: true, uuidOveride: pageUuid })
      uncheckAllRadios()
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
        redirectPageTitle: 'Add a note',
        RedirectPage: AddNotePage,
      },
      {
        value: 'ATTENDED_FAILED_TO_COMPLY',
        text: 'Attended - failed to comply',
        hint: 'For example, they did not follow instructions.',
        redirectPageTitle: 'Enforcement action for Alton’s failure to comply',
        RedirectPage: AttendedFailedToComplyPage,
      },
    )
    if (inOffice) {
      options.push(
        {
          value: 'ATTENDED_SENT_HOME_BEHAVIOUR',
          text: 'Attended - sent home (behaviour)',
          hint: 'For example, their behaviour was disruptive',
          redirectPageTitle: 'Enforcement action for Alton’s failure to comply',
          RedirectPage: AttendedFailedToComplyPage,
        },
        {
          value: 'ATTENDED_SENT_HOME_SERVICE_ISSUES',
          text: 'Attended - sent home (service issues)',
          hint: 'For example, the building was unexpectedly closed.',
          redirectPageTitle: 'Add a note',
          RedirectPage: AddNotePage,
        },
      )
    }
  }
  options.push({
    value: 'ACCEPTABLE_ABSENCE',
    text: 'Acceptable absence',
    hint: dateInPast ? 'They provided an acceptable reason or evidence.' : null,
    redirectPageTitle: 'Why was Alton’s absence acceptable?',
    RedirectPage: AcceptableAbsencePage,
  })
  if (dateInPast) {
    options.push(
      {
        value: 'UNACCEPTABLE_ABSENCE',
        text: 'Unacceptable absence',
        hint: 'They did not provide suitable evidence.',
        redirectPageTitle: 'Enforcement action for Alton’s unacceptable absence',
        RedirectPage: UnacceptableAbsencePage,
      },
      {
        value: 'FAILED_TO_ATTEND',
        text: 'Failed to attend',
        hint: 'You may still need to request and review evidence.',
        redirectPageTitle: 'Enforcement action for Alton’s absence',
        RedirectPage: FailedToAttendPage,
      },
    )
  }
  if (!dateInPast) {
    options.push({
      value: 'WILL_BE_RESCHEDULED',
      text: 'The appointment will be rescheduled',
      redirectPageTitle: 'Reschedule an appointment',
      RedirectPage: RescheduleAppointmentPage,
    })
  }
  return options
}

const checkValidationErrors = ({
  journey = 'MANAGE',
  dateInPast = true,
}: { journey?: Journey; inOffice?: boolean; dateInPast?: boolean } = {}): void => {
  const msg = dateInPast ? 'Select an outcome for this appointment' : 'Select why they will not attend this appointment'
  outcomePage = new OutcomePage()
  outcomePage.getSubmitBtn().click()
  outcomePage.checkErrorSummaryBox([msg])
  getUuid(2).then(pageUuid => {
    const id = journey === 'MANAGE' ? appointmentId : pageUuid
    cy.get(`#appointments-${crn}-${id}-outcome-outcomeType-error`).should('contain.text', msg)
  })
}

describe('Appointment outcome', () => {
  let journey: Journey
  let inOffice: boolean
  let dateInPast: boolean
  let options: ExpectedOption<RedirectPages>[]

  describe('Arrange appointment journey', { testIsolation: false }, () => {
    before(() => {
      journey = 'ARRANGE' as Journey
      inOffice = true
      dateInPast = true
      options = getExpectedOptions({ inOffice, dateInPast })
      loadPage({ journey, inOffice, dateInPast })
      outcomePage = new OutcomePage()
    })

    it('check page rendered', () => {
      outcomePage.checkPageTitle('What was the outcome of this appointment?')
    })
    it('check validation error for past appointment', () => {
      checkValidationErrors({ journey, dateInPast })
      cy.go('back')
    })
    it('check redirect options for past and inOffice appointment', () => {
      checkOptionRedirects(options, OutcomePage)
    })
    it('backLink goes to previous page', () => {
      outcomePage.getCancelGoBackLink().click()
      const page = new AppointmentLocationDateTimePage()
      page.checkOnPage()
    })
  })
  describe('Manage appointment journey', { testIsolation: false }, () => {
    before(() => {
      journey = 'MANAGE' as Journey
      inOffice = true
      dateInPast = false
      options = getExpectedOptions({ inOffice, dateInPast })
      loadPage({ journey, inOffice, dateInPast })
      outcomePage = new OutcomePage()
    })

    it('check page rendered', () => {
      outcomePage.checkPageTitle('Why will Alton not attend this appointment?')
    })
    it('check validation error for future appointment', () => {
      checkValidationErrors({ journey, dateInPast })
      cy.go('back')
    })
    it('check untested redirect option for future appointment', () => {
      checkOptionRedirects(options, OutcomePage)
    })
    it('backLink goes to previous page', () => {
      outcomePage.getCancelGoBackLink().click()
      manageAppointmentPage = new ManageAppointmentPage()
      manageAppointmentPage.getTaskLink(1).click()
      outcomePage.checkPageTitle('Why will Alton not attend this appointment?')
    })
  })
  describe('Reschedule appointment journey', { testIsolation: false }, () => {
    before(() => {
      journey = 'RESCHEDULE' as Journey
      inOffice = false
      dateInPast = true
      options = getExpectedOptions({ inOffice, dateInPast })
      loadPage({ journey, inOffice, dateInPast })
      outcomePage = new OutcomePage()
    })

    it('check page rendered', () => {
      outcomePage.checkPageTitle('What was the outcome of this appointment?')
    })
    it('backLink goes to previous page', () => {
      outcomePage.getCancelGoBackLink().click()
      const page = new AppointmentLocationDateTimePage()
      page.checkOnPage()
    })
  })
})
