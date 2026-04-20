import { DateTime } from 'luxon'
import { checkPopHeader } from '../appointments/imports'
import { crn, uuid, appointmentId } from '../appointments/imports/common'
import FailedToAttendPage from '../../pages/appointmentOutcomes/attended-failed-to-comply.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import OutcomePage from '../../pages/appointmentOutcomes/outcome.page'
import {
  completeSentencePage,
  completeTypePage,
  completeLocationDateTimePage,
  completeRescheduleAppointmentPage,
  getUuid,
} from '../appointments/utils'
import SendLetterPage from '../../pages/appointmentOutcomes/send-letter.page'
import InitiateBreachOrRecallPage from '../../pages/appointmentOutcomes/initiate-breach-or-recall.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'
import EnforcementActionPage from '../../pages/appointmentOutcomes/enforcement-action.page'
import { ExpectedOption, checkOptionRedirectsToCorrectPage, checkOptions } from './imports'

let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage
let failedToAttendPage: FailedToAttendPage
let checkYourAnswersPage: RescheduleCheckYourAnswerPage

const now = DateTime.now()
const date = now.plus({ days: 2 })
const responseByDate = date.toFormat('yyyy-MM-dd')

const loadPage = ({
  journey = 'MANAGE',
  isProbationPractitioner = false,
  enforcementActionResponseByDate = responseByDate,
} = {}): void => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3007/__test/clear-session',
  })
  cy.task('stubEnableNonCompliance')
  cy.task('stubAppointment', { eventId: '2501192724', isFuture: false, enforcementActionResponseByDate })
  if (isProbationPractitioner) {
    cy.task('stubProbationPractitioner', { username: 'USER1' })
  }
  if (journey === 'MANAGE') {
    cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
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
  if (journey === 'ARRANGE') {
    completeSentencePage()
    completeTypePage(1)
    completeLocationDateTimePage({ dateInPast: true })
  }
  outcomePage = new OutcomePage()
  cy.get(`.govuk-radios__input[value=FAILED_TO_ATTEND]`).click()
  outcomePage.getSubmitBtn().click()
}

type RedirectPages = SendLetterPage | InitiateBreachOrRecallPage | AddNotePage | EnforcementActionPage

const getExpectedOptions = ({ isProbationPractitioner = false } = {}): ExpectedOption<RedirectPages>[] => {
  const expectedOptions: ExpectedOption<RedirectPages>[] = [
    { value: 'SEND_LETTER', text: 'Send a letter', RedirectPage: SendLetterPage, redirectPageName: 'Send a letter' },
    {
      value: 'DECISION_PENDING',
      text: 'Decision pending Alton’s response',
      RedirectPage: AddNotePage,
      redirectPageName: 'Add a note',
      redirectPageTitle: 'Add a note',
    },
  ]
  if (!isProbationPractitioner) {
    expectedOptions.push({
      value: 'REFER_TO_OFFENDER_MANAGER',
      text: 'Refer to offender manager',
      hint: 'Notify the allocated probation practitioner so they can take action.',
      redirectPageName: 'Add a note',
      redirectPageTitle: 'Add a note',
      RedirectPage: AddNotePage,
    })
  }
  expectedOptions.push({
    value: 'DIFFERENT_ACTION',
    text: 'I want to add a different action',
    RedirectPage: EnforcementActionPage,
    redirectPageName: 'Enforcement action',
    redirectPageTitle: 'Select an enforcement action for Alton’s failure to comply',
  })
  return expectedOptions
}

const checkPage = ({ journey = 'MANAGE' } = {}) => {
  it(`should render the page if user is not probation practitioner${journey === 'MANAGE' ? ' and submit evidence in 2 days' : ''}`, () => {
    loadPage({ journey })
    failedToAttendPage = new FailedToAttendPage()
    failedToAttendPage.checkPageTitle('Enforcement action for Alton’s absence')
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
    if (['MANAGE', 'RESCHEDULE'].includes(journey)) {
      cy.get('[data-qa="ticket"]')
        .find('h2')
        .should('contain.text', `Alton has until ${date.toFormat('d LLLL')} to submit evidence (2 days remaining)`)
      cy.get('[data-qa="ticket"]')
        .find('p')
        .should(
          'contain.text',
          'This appointment has been marked as failed to attend until evidence is provided. It will be added to the NDelius Enforcement Diary.',
        )
    } else {
      cy.get('[data-qa="ticket"]').should('not.exist')
    }
    cy.get('legend').should('contain.text', 'Select an enforcement action for Alton’s absence')
    const options = getExpectedOptions()
    checkOptions(options)
  })
  it(`should render the page if user is probation practitioner${journey === 'MANAGE' ? ' and submit evidence in 1 day' : ''}`, () => {
    const tomorrow = now.plus({ days: 1 })
    const enforcementActionResponseByDate = tomorrow.toFormat('yyyy-MM-dd')
    loadPage({ journey, isProbationPractitioner: true, enforcementActionResponseByDate })
    if (journey === 'MANAGE') {
      cy.get('[data-qa="ticket"]')
        .find('h2')
        .should('contain.text', `Alton has until ${tomorrow.toFormat('d LLLL')} to submit evidence (1 day remaining)`)
    }
    const options = getExpectedOptions({ isProbationPractitioner: true })
    checkOptions(options)
  })
  it('should have the correct back link', () => {
    loadPage({ journey })
    let expectedLink: string
    getUuid(3).then(pageUuid => {
      if (journey === 'MANAGE') {
        expectedLink = `/case/${crn}/appointments/appointment/${appointmentId}/outcome`
      } else {
        expectedLink = `/case/${crn}/arrange-appointment/${pageUuid}/outcome`
      }
      failedToAttendPage.getBackLink().should('have.attr', 'href', expectedLink)
    })
  })
  it('should show validation error when no option is selected', () => {
    const msg = 'Select an enforcement action for their absence'
    loadPage({ journey })
    failedToAttendPage = new FailedToAttendPage()
    failedToAttendPage.getSubmitBtn().click()
    failedToAttendPage.checkErrorSummaryBox([msg])
    getUuid(3).then(pageUuid => {
      const id = journey === 'MANAGE' ? appointmentId : pageUuid
      cy.get(`#appointments-${crn}-${id}-outcome-enforcementAction-error`).should('contain.text', msg)
    })
  })
  it('should redirect to the correct page when an option is selected', () => {
    const options = getExpectedOptions()
    checkOptionRedirectsToCorrectPage(options, loadPage, {
      Page: FailedToAttendPage,
      manageJourney: journey === 'MANAGE',
    })
  })
}

describe('Failed to attend', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  afterEach(() => {
    cy.task('resetMocks')
  })
  // describe('Manage appointment journey', () => {
  //   checkPage()
  // })
  // describe('Arrange appointment journey', () => {
  //   checkPage({ journey: 'ARRANGE' })
  // })
  describe('Reschedule appointment journey', () => {
    checkPage({ journey: 'RESCHEDULE' })
  })
})
