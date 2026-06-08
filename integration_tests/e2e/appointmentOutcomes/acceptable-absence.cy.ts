import { checkPopHeader } from '../appointments/imports'
import { crn, appointmentId } from '../appointments/imports/common'
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
  checkOptionRedirectsToCorrectPage,
  checkOptions,
} from './imports'
import AcceptableAbsencePage from '../../pages/appointmentOutcomes/acceptable-absence.page'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'
import { SentenceType } from '../../../server/data/model/sentenceDetails'

let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage
let acceptableAbsencePage: AcceptableAbsencePage
let checkYourAnswersPage: RescheduleCheckYourAnswerPage

const loadPage = ({
  journey = 'MANAGE',
  sentenceLength = 25,
  sentenceType = 'COMMUNITY',
}: { journey?: Journey; sentenceLength?: number; sentenceType?: SentenceType } = {}): void => {
  const endDate = sentenceLength === 12 ? '2024-12-01' : '2027-01-01'
  cy.task('stubSentences', { endDate, sentenceType })
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
  uncheckAllRadios()
  cy.get(`.govuk-radios__input[value=ACCEPTABLE_ABSENCE]`).click()
  outcomePage.getSubmitBtn().click()
}

type RedirectPages = SendLetterPage | InitiateBreachOrRecallPage | AddNotePage | EnforcementActionPage

const getExpectedOptions = ({
  sentenceLength = 25,
}: { sentenceLength?: number } = {}): ExpectedOption<RedirectPages>[] => {
  const expectedOptions: ExpectedOption<RedirectPages>[] = [
    {
      value: 'ACCEPTABLE_ABSENCE_COURT_LEGAL',
      text: 'Court / legal',
      RedirectPage: AddNotePage,
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'ACCEPTABLE_ABSENCE_EMPLOYMENT',
      text: 'Employment',
      RedirectPage: AddNotePage,
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'ACCEPTABLE_ABSENCE_FAMILY_CHILDCARE',
      text: 'Family / childcare',
      RedirectPage: AddNotePage,
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'ACCEPTABLE_ABSENCE_HOLIDAY',
      text: 'Holiday',
      RedirectPage: AddNotePage,
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'ACCEPTABLE_ABSENCE_MEDICAL',
      text: 'Medical',
      RedirectPage: AddNotePage,
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'ACCEPTABLE_ABSENCE_RELIGIOUS',
      text: 'Religious',
      RedirectPage: AddNotePage,
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'ACCEPTABLE_ABSENCE_RIC',
      text: 'RIC (remanded in custody)',
      RedirectPage: AddNotePage,
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'ACCEPTABLE_ABSENCE_PROFESSIONAL_JUDGEMENT_DECISION',
      text: 'Professional judgement decision',
      RedirectPage: AddNotePage,
      redirectPageTitle: 'Add a note',
    },
  ]
  if (sentenceLength > 24) {
    expectedOptions.push({
      value: 'ACCEPTABLE_FAILURE',
      text: 'Acceptable failure - none in the following 12 months',
      hint: 'There have been no failures to attend other appointments in the last 12 months.',
      RedirectPage: AddNotePage,
      redirectPageTitle: 'Add a note',
    })
  }
  return expectedOptions
}

const checkPage = ({ journey = 'MANAGE' }: { journey?: Journey } = {}) => {
  it('should render the page if sentence length is over 24 months', () => {
    loadPage({ journey })
    acceptableAbsencePage = new AcceptableAbsencePage()
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
    cy.get('legend').should('contain.text', 'Why was Alton’s absence acceptable?')
    const options = getExpectedOptions()
    checkOptions(options)
  })
  it('should render the page if sentence length is 24 months or less', () => {
    loadPage({ journey, sentenceLength: 12 })
    const options = getExpectedOptions({ sentenceLength: 12 })
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
      acceptableAbsencePage.getBackLink().should('have.attr', 'href', expectedLink)
    })
  })
  it('should show validation error when no option is selected', () => {
    const msg = 'Select why their absence was acceptable'
    loadPage({ journey })
    acceptableAbsencePage = new AcceptableAbsencePage()
    uncheckAllRadios()
    acceptableAbsencePage.getSubmitBtn().click()
    acceptableAbsencePage.checkErrorSummaryBox([msg])
    getUuid(3).then(uuid => {
      const id = journey === 'MANAGE' ? appointmentId : uuid
      cy.get(`#appointments-${crn}-${id}-outcome-acceptableAbsence-error`).should('contain.text', msg)
    })
  })

  it('should redirect to the correct page when an option is selected', () => {
    const options = getExpectedOptions()
    checkOptionRedirectsToCorrectPage(options, loadPage, { Page: AcceptableAbsencePage, journey })
  })

  checkBreachOrRecallWarningBanner(loadPage, { Page: AcceptableAbsencePage })
}

describe('Acceptable absence', () => {
  beforeEach(() => {
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
