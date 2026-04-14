import { checkPopHeader } from '../appointments/imports'
import { crn, uuid, appointmentId } from '../appointments/imports/common'
import AttendedFailedToComplyPage from '../../pages/appointmentOutcomes/attended-failed-to-comply.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import OutcomePage from '../../pages/appointmentOutcomes/outcome.page'
import { completeSentencePage, completeTypePage, completeLocationDateTimePage } from '../appointments/utils'
import SendLetterPage from '../../pages/appointmentOutcomes/send-letter.page'
import InitiateBreachOrRecallPage from '../../pages/appointmentOutcomes/initiate-breach-or-recall.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import EnforcementActionPage from '../../pages/appointmentOutcomes/enforcement-action.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import { ExpectedOption, checkOptionRedirectsToCorrectPage, checkOptions } from './imports'

let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage
let attendedFailedToComplyPage: AttendedFailedToComplyPage

const loadPage = ({ manageJourney = true, sentenceType = 'community', isProbationPractitioner = false } = {}): void => {
  cy.task('stubEnableNonCompliance')
  cy.task('stubAppointment', { eventId: '2501192724', isFuture: false })
  if (isProbationPractitioner) {
    cy.task('stubProbationPractitioner', { username: 'USER1' })
  }
  if (sentenceType === 'custody') {
    cy.task('stubSentences', { sentenceType: 'CUSTODY' })
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
  cy.get(`.govuk-radios__input[value=ATTENDED_SENT_HOME_BEHAVIOUR]`).click()
  outcomePage.getSubmitBtn().click()
}

type Pages =
  | SendLetterPage
  | InitiateBreachOrRecallPage
  | AddNotePage
  | EnforcementActionPage
  | ManageAppointmentPage
  | AppointmentCheckYourAnswersPage

const getExpectedOptions = ({
  manageJourney = true,
  isProbationPractitioner = false,
  sentenceType = 'community',
} = {}): ExpectedOption<Pages>[] => {
  const text = sentenceType === 'community' ? 'breach' : 'recall'
  const expectedOptions: ExpectedOption<Pages>[] = [
    { value: 'SEND_LETTER', text: 'Send a letter', Page: SendLetterPage, pageName: 'Send a letter' },
    {
      value: 'BREACH_RECALL_INITIATED',
      text: `Initiate a ${text}`,
      Page: InitiateBreachOrRecallPage,
      pageName: `Initiate a ${text}`,
      pageTitle: `Initiate a ${text}`,
    },
    {
      value: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      text: `Initiate a ${text} and send a letter`,
      Page: InitiateBreachOrRecallPage,
      pageName: `Initiate a ${text}`,
      pageTitle: `Initiate a ${text}`,
    },
  ]
  if (!isProbationPractitioner) {
    expectedOptions.push({
      value: 'REFER_TO_OFFENDER_MANAGER',
      text: 'Refer to probation practitioner',
      hint: 'Notify the allocated probation practitioner so they can take action.',
      pageName: 'Add a note',
      Page: AddNotePage,
    })
  }
  expectedOptions.push(
    {
      value: 'NO_FURTHER_ACTION',
      text: 'No further action',
      Page: manageJourney ? ManageAppointmentPage : AppointmentCheckYourAnswersPage,
      pageName: manageJourney ? 'Manage appointment' : 'Check your answers',
      pageTitle: manageJourney ? 'Manage 3 way meeting (NS) with Terry Jones' : 'Check your answers',
    },
    {
      value: 'DIFFERENT_ACTION',
      text: 'I want to add a different action',
      Page: EnforcementActionPage,
      pageName: 'Enforcement action',
      pageTitle: 'Select an enforcement action for Alton’s failure to comply',
    },
  )
  return expectedOptions
}

const checkPage = ({ manageJourney = true } = {}) => {
  it('should render the page if sentence type is community and user is not probation practitioner', () => {
    loadPage({ manageJourney })
    attendedFailedToComplyPage = new AttendedFailedToComplyPage()
    attendedFailedToComplyPage.checkPageTitle('Enforcement action for Alton’s failure to comply')
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
    cy.get('legend').should('contain.text', 'Select an action for Alton’s failure to comply')
    const options = getExpectedOptions({ manageJourney })
    checkOptions(options)
  })
  it('should render the page if sentence type is custody and user is probation practitioner', () => {
    loadPage({ manageJourney, sentenceType: 'custody', isProbationPractitioner: true })
    const options = getExpectedOptions({ manageJourney, sentenceType: 'custody', isProbationPractitioner: true })
    checkOptions(options)
  })
  it('should have the correct back link', () => {
    loadPage({ manageJourney })
    const expectedLink = manageJourney
      ? `/case/${crn}/appointments/appointment/${appointmentId}/outcome`
      : `/case/${crn}/arrange-appointment/${uuid}/outcome`
    attendedFailedToComplyPage.getBackLink().should('have.attr', 'href', expectedLink)
  })
  it('should show validation error when no option is selected', () => {
    const msg = 'Select an action for this failure to comply'
    loadPage({ manageJourney })
    const options = getExpectedOptions({ manageJourney })
    attendedFailedToComplyPage = new AttendedFailedToComplyPage()
    attendedFailedToComplyPage.getSubmitBtn().click()
    attendedFailedToComplyPage.checkErrorSummaryBox([msg])
    const id = manageJourney ? appointmentId : uuid
    cy.get(`#appointments-${crn}-${id}-outcome-enforcementAction-error`).should('contain.text', msg)
  })
  it('should redirect to the correct page when an option is selected', () => {
    const options = getExpectedOptions({ manageJourney })
    checkOptionRedirectsToCorrectPage(options, loadPage, { Page: AttendedFailedToComplyPage, manageJourney })
  })
}

describe('Attended but failed to comply', () => {
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
