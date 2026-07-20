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
  uncheckAllRadios,
} from '../appointments/utils'
import SendLetterPage from '../../pages/appointmentOutcomes/send-letter.page'
import InitiateBreachOrRecallPage from '../../pages/appointmentOutcomes/initiate-breach-or-recall.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import EnforcementActionPage from '../../pages/appointmentOutcomes/enforcement-action.page'
import {
  ExpectedOption,
  Journey,
  checkBreachOrRecallWarningBanner,
  checkOptionRedirects,
  checkOptions,
  checkTicketPanel,
} from './imports'
import { SentenceType } from '../../../server/data/model/sentenceDetails'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'

let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage
let attendedFailedToComplyPage: AttendedFailedToComplyPage
let checkYourAnswersPage: RescheduleCheckYourAnswerPage

const loadPage = ({
  journey = 'MANAGE',
  sentenceType = 'COMMUNITY',
  isProbationPractitioner = false,
}: { journey?: Journey; sentenceType?: SentenceType; isProbationPractitioner?: boolean } = {}): void => {
  cy.task('stubAppointment', { eventId: '2501192724', isFuture: false })
  if (isProbationPractitioner) {
    cy.task('stubProbationPractitioner', { username: 'USER1' })
  }
  if (sentenceType === 'CUSTODY') {
    cy.task('stubSentences', { sentenceType: 'CUSTODY' })
  }
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
  uncheckAllRadios()
  cy.get(`.govuk-radios__input[value=UNACCEPTABLE_ABSENCE]`).click()
  outcomePage.getSubmitBtn().click()
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

const checkPage = ({ journey = 'MANAGE' }: { journey?: Journey } = {}) => {
  it('should render the page if sentence type is community and user is not probation practitioner', () => {
    loadPage({ journey })
    attendedFailedToComplyPage = new AttendedFailedToComplyPage()
    attendedFailedToComplyPage.checkPageTitle('Enforcement action for Alton’s unacceptable absence')
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
    cy.get('legend').should('contain.text', 'Select an action for Alton’s unacceptable absence')
    const options = getExpectedOptions()
    checkOptions(options)
  })
  it('should render the page if sentence type is custody and user is probation practitioner', () => {
    loadPage({ journey, sentenceType: 'CUSTODY', isProbationPractitioner: true })
    const options = getExpectedOptions({ sentenceType: 'CUSTODY', isProbationPractitioner: true })
    checkOptions(options)
  })
  it('should have the correct back link', () => {
    loadPage({ journey })
    let expectedLink: string
    getUuid(3).then(uuid => {
      if (journey === 'MANAGE') {
        expectedLink = `/case/${crn}/appointments/appointment/${appointmentId}/outcome`
      } else {
        expectedLink = `/case/${crn}/arrange-appointment/${uuid}/outcome`
      }
      attendedFailedToComplyPage.getBackLink().should('have.attr', 'href', expectedLink)
    })
  })
  it('should show validation error when no option is selected', () => {
    const msg = 'Select an action for their unacceptable absence'
    loadPage({ journey })
    attendedFailedToComplyPage = new AttendedFailedToComplyPage()
    uncheckAllRadios()
    attendedFailedToComplyPage.getSubmitBtn().click()
    attendedFailedToComplyPage.checkErrorSummaryBox([msg])
    getUuid(3).then(uuid => {
      const id = journey === 'MANAGE' ? appointmentId : uuid
      cy.get(`#appointments-${crn}-${id}-outcome-unacceptableAbsence-error`).should('contain.text', msg)
    })
  })
  it('should redirect to the correct page when an option is selected', () => {
    const options = getExpectedOptions()
    loadPage({ journey })
    checkOptionRedirects(options, AttendedFailedToComplyPage)
  })

  checkBreachOrRecallWarningBanner(loadPage, AttendedFailedToComplyPage)
  checkTicketPanel(loadPage, AttendedFailedToComplyPage)
}

describe('Unacceptable absence', () => {
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
