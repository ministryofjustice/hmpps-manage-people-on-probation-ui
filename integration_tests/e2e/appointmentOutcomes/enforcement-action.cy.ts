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
import SendLetterPage from '../../pages/appointmentOutcomes/send-letter.page'
import InitiateBreachOrRecallPage from '../../pages/appointmentOutcomes/initiate-breach-or-recall.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import EnforcementActionPage from '../../pages/appointmentOutcomes/enforcement-action.page'
import { ExpectedOption, Journey } from './imports'
import { SentenceType } from '../../../server/data/model/sentenceDetails'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'

let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage
let attendedFailedToComplyPage: AttendedFailedToComplyPage
let enforcementActionPage: EnforcementActionPage
let checkYourAnswersPage: RescheduleCheckYourAnswerPage
let addNotePage: AddNotePage

const loadPage = ({
  journey = 'MANAGE',
}: { journey?: Journey; sentenceType?: SentenceType; isProbationPractitioner?: boolean } = {}): void => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3007/__test/clear-session',
  })
  cy.task('stubEnableNonCompliance')
  cy.task('stubAppointment', { eventId: '2501192724', isFuture: false })

  if (journey === 'MANAGE') {
    cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getTaskLink(1).click()
  }
  if (journey === 'ARRANGE') {
    completeSentencePage()
    completeTypePage(1)
    completeLocationDateTimePage({ dateInPast: true })
  }
  if (journey === 'RESCHEDULE') {
    completeRescheduleAppointmentPage(true, crn)
    checkYourAnswersPage = new RescheduleCheckYourAnswerPage()
    checkYourAnswersPage.getSubmitBtn().click()
    getUuid(2).then(pageUuid => {
      completeLocationDateTimePage({ dateInPast: true, uuidOveride: pageUuid })
    })
  }
  outcomePage = new OutcomePage()
  cy.get(`.govuk-radios__input[value=ATTENDED_FAILED_TO_COMPLY]`).click()
  outcomePage.getSubmitBtn().click()
  attendedFailedToComplyPage = new AttendedFailedToComplyPage()
  cy.get(`.govuk-radios__input[value=DIFFERENT_ACTION]`).click()
  attendedFailedToComplyPage.getSubmitBtn().click()
}

type RedirectPages = SendLetterPage | InitiateBreachOrRecallPage | AddNotePage | EnforcementActionPage

const getExpectedOptions = ({
  isProbationPractitioner = false,
  sentenceType = 'COMMUNITY',
}: { isProbationPractitioner?: boolean; sentenceType?: SentenceType } = {}): ExpectedOption<RedirectPages>[] => {
  const text = sentenceType === 'COMMUNITY' ? 'breach' : 'recall'
  const expectedOptions: ExpectedOption<RedirectPages>[] = [
    { value: 'SEND_LETTER', text: 'Send a letter', RedirectPage: SendLetterPage, redirectPageName: 'Send a letter' },
    {
      value: 'INITIATE_BREACH_RECALL',
      text: `Initiate a ${text}`,
      RedirectPage: InitiateBreachOrRecallPage,
      redirectPageName: `Initiate a ${text}`,
      redirectPageTitle: `Initiate a ${text}`,
    },
    {
      value: 'INITIATE_BREACH_RECALL_AND_SEND_LETTER',
      text: `Initiate a ${text} and send a letter`,
      RedirectPage: InitiateBreachOrRecallPage,
      redirectPageName: `Initiate a ${text}`,
      redirectPageTitle: `Initiate a ${text}`,
    },
  ]
  if (!isProbationPractitioner) {
    expectedOptions.push({
      value: 'REFER_TO_OFFENDER_MANAGER',
      text: 'Refer to offender manager',
      hint: 'Notify the allocated probation practitioner so they can take action.',
      redirectPageName: 'Add a note',
      RedirectPage: AddNotePage,
    })
  }
  expectedOptions.push(
    {
      value: 'NO_FURTHER_ACTION',
      text: 'No further action',
      RedirectPage: AddNotePage,
      redirectPageName: 'Add a note',
    },
    {
      value: 'DIFFERENT_ACTION',
      text: 'I want to add a different action',
      RedirectPage: EnforcementActionPage,
      redirectPageName: 'Enforcement action',
      redirectPageTitle: 'Select an enforcement action for Alton’s failure to comply',
    },
  )
  return expectedOptions
}

const checkPage = ({ journey = 'MANAGE' }: { journey?: Journey } = {}) => {
  it('should render the page', () => {
    loadPage({ journey })
    attendedFailedToComplyPage = new AttendedFailedToComplyPage()
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
    attendedFailedToComplyPage.checkPageTitle('Select an enforcement action for Alton’s failure to comply')
    cy.get('select').contains('option', 'Decision pending Alton’s response')
  })

  it('should have the correct back link', () => {
    loadPage({ journey })
    let expectedLink: string
    getUuid(3).then(uuid => {
      if (journey === 'MANAGE') {
        expectedLink = `/case/${crn}/appointments/appointment/${appointmentId}/outcome/attended-failed-to-comply`
      } else {
        expectedLink = `/case/${crn}/arrange-appointment/${uuid}/outcome/attended-failed-to-comply`
      }
      attendedFailedToComplyPage.getBackLink().should('have.attr', 'href', expectedLink)
    })
  })
  it('should show validation error when no option is selected for breach created by', () => {
    const msg = 'Select an enforcement action for their failure to comply'
    loadPage({ journey })
    enforcementActionPage = new EnforcementActionPage()
    enforcementActionPage.getSubmitBtn().click()
    enforcementActionPage.checkErrorSummaryBox([msg])
    getUuid(3).then(uuid => {
      const id = journey === 'MANAGE' ? appointmentId : uuid
      cy.get(`#appointments-${crn}-${id}-outcome-enforcementAction-error`).should('contain.text', msg)
    })
    cy.pause()
  })
  it('should redirect to the correct page when an option is selected', () => {
    loadPage({ journey })
    cy.get('select').select('DECISION_PENDING_RESPONSE')
    enforcementActionPage.getSubmitBtn().click()
    addNotePage = new AddNotePage()
    addNotePage.checkOnPage()
  })
}

describe('Enforcement action', () => {
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
