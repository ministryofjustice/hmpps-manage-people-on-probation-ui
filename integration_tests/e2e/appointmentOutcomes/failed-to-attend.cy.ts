import { checkPopHeader } from '../appointments/imports'
import { crn, uuid, appointmentId } from '../appointments/imports/common'
import FailedToAttendPage from '../../pages/appointmentOutcomes/attended-failed-to-comply.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import OutcomePage from '../../pages/appointmentOutcomes/outcome.page'
import { completeSentencePage, completeTypePage, completeLocationDateTimePage } from '../appointments/utils'
import SendLetterPage from '../../pages/appointmentOutcomes/send-letter.page'
import InitiateBreachOrRecallPage from '../../pages/appointmentOutcomes/initiate-breach-or-recall.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import EnforcementActionPage from '../../pages/appointmentOutcomes/enforcement-action.page'
import { ExpectedOption, checkOptionRedirectsToCorrectPage, checkOptions } from './imports'

let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage
let failedToAttendPage: FailedToAttendPage

const loadPage = ({ manageJourney = true, isProbationPractitioner = false } = {}): void => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3007/__test/clear-session',
  })
  cy.task('stubEnableNonCompliance')
  cy.task('stubAppointment', { eventId: '2501192724', isFuture: false })
  if (isProbationPractitioner) {
    cy.task('stubProbationPractitioner', { username: 'USER1' })
  }
  if (manageJourney) {
    cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getTaskLink(1).click()
  } else {
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

const checkPage = ({ manageJourney = true } = {}) => {
  it('should render the page if user is not probation practitioner', () => {
    loadPage({ manageJourney })
    failedToAttendPage = new FailedToAttendPage()
    failedToAttendPage.checkPageTitle('Enforcement action for Alton’s absence')
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
    cy.get('legend').should('contain.text', 'Select an enforcement action for Alton’s absence')
    const options = getExpectedOptions()
    checkOptions(options)
  })
  it('should render the page if user is probation practitioner', () => {
    loadPage({ manageJourney, isProbationPractitioner: true })
    const options = getExpectedOptions({ isProbationPractitioner: true })
    checkOptions(options)
  })
  it('should have the correct back link', () => {
    loadPage({ manageJourney })
    const expectedLink = manageJourney
      ? `/case/${crn}/appointments/appointment/${appointmentId}/outcome`
      : `/case/${crn}/arrange-appointment/${uuid}/outcome`
    failedToAttendPage.getBackLink().should('have.attr', 'href', expectedLink)
  })
  it('should show validation error when no option is selected', () => {
    const msg = 'Select an enforcement action for their absence'
    loadPage({ manageJourney })
    failedToAttendPage = new FailedToAttendPage()
    failedToAttendPage.getSubmitBtn().click()
    failedToAttendPage.checkErrorSummaryBox([msg])
    const id = manageJourney ? appointmentId : uuid
    cy.get(`#appointments-${crn}-${id}-outcome-enforcementAction-error`).should('contain.text', msg)
  })
  it('should redirect to the correct page when an option is selected', () => {
    const options = getExpectedOptions()
    checkOptionRedirectsToCorrectPage(options, loadPage, { Page: FailedToAttendPage, manageJourney })
  })
}

describe('Failed to attend', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  afterEach(() => {
    cy.task('resetMocks')
  })
  describe('Manage appointment journey', () => {
    checkPage()
  })
  describe('Arrange appointment journey', () => {
    checkPage({ manageJourney: false })
  })
})
