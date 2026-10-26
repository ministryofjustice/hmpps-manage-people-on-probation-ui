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
import { ExpectedOption, Journey, checkOptionRedirects } from './imports'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'

let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage
let attendedFailedToComplyPage: AttendedFailedToComplyPage
let checkYourAnswersPage: RescheduleCheckYourAnswerPage

type RedirectPages = SendLetterPage | InitiateBreachOrRecallPage | AddNotePage | EnforcementActionPage

const loadPage = ({ journey = 'MANAGE' }: { journey?: Journey } = {}): void => {
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
    completeRescheduleAppointmentPage({ crn })
    checkYourAnswersPage = new RescheduleCheckYourAnswerPage()
    checkYourAnswersPage.getSubmitBtn().click()
    getUuid(2).then(pageUuid => {
      completeLocationDateTimePage({ dateInPast: true, uuidOveride: pageUuid })
    })
  }
  outcomePage = new OutcomePage()
  cy.get(`.govuk-radios__input[value=ATTENDED_SENT_HOME_BEHAVIOUR]`).click()
  outcomePage.getSubmitBtn().click()
}

const getExpectedOptions = ({
  isProbationPractitioner = false,
  sentenceType = 'COMMUNITY',
} = {}): ExpectedOption<RedirectPages>[] => {
  const text = sentenceType === 'COMMUNITY' ? 'breach' : 'recall'
  const expectedOptions: ExpectedOption<RedirectPages>[] = [
    { value: 'SEND_LETTER', text: 'Send a letter', RedirectPage: SendLetterPage, redirectPageName: 'Send a letter' },
    {
      value: 'BREACH_RECALL_INITIATED',
      text: `Initiate a ${text}`,
      RedirectPage: InitiateBreachOrRecallPage,
      redirectPageTitle: `Initiate a ${text}`,
    },
    {
      value: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      text: `Initiate a ${text} and send a letter`,
      RedirectPage: InitiateBreachOrRecallPage,
      redirectPageTitle: `Initiate a ${text}`,
    },
  ]
  if (!isProbationPractitioner) {
    expectedOptions.push({
      value: 'REFER_TO_OFFENDER_MANAGER',
      text: 'Refer to offender manager',
      hint: 'Notify the allocated probation practitioner so they can take action.',
      redirectPageTitle: 'Add a note',
      RedirectPage: AddNotePage,
    })
  }
  expectedOptions.push(
    {
      value: 'NO_FURTHER_ACTION',
      text: 'No further action',
      RedirectPage: AddNotePage,
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'DIFFERENT_ACTION',
      text: 'I want to add a different action',
      RedirectPage: EnforcementActionPage,
      redirectPageTitle: 'Select an enforcement action for Alton’s failure to comply',
    },
  )
  return expectedOptions
}

describe('Attended but failed to comply', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  it('should link to the page in the manage appointment journey', () => {
    loadPage()
    attendedFailedToComplyPage = new AttendedFailedToComplyPage()
    attendedFailedToComplyPage.checkPageTitle('Enforcement action for Alton’s failure to comply')
  })
  it('should link to the page in the arrange appointment journey', () => {
    loadPage({ journey: 'ARRANGE' })
    attendedFailedToComplyPage = new AttendedFailedToComplyPage()
    attendedFailedToComplyPage.checkPageTitle('Enforcement action for Alton’s failure to comply')
  })
  it('should link to the page in the reschedule appointment journey', () => {
    loadPage({ journey: 'RESCHEDULE' })
    attendedFailedToComplyPage = new AttendedFailedToComplyPage()
    attendedFailedToComplyPage.checkPageTitle('Enforcement action for Alton’s failure to comply')
  })
  it('should show validation error when no option is selected', () => {
    const msg = 'Select an action for their failure to comply'
    loadPage()
    attendedFailedToComplyPage = new AttendedFailedToComplyPage()
    attendedFailedToComplyPage.getSubmitBtn().click()
    attendedFailedToComplyPage.checkErrorSummaryBox([msg])
  })
  it('should redirect to the correct page when an option is selected', () => {
    const options = getExpectedOptions()
    loadPage()
    checkOptionRedirects(options, AttendedFailedToComplyPage)
  })
})
