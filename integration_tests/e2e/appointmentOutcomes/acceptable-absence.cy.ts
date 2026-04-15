import { checkPopHeader } from '../appointments/imports'
import { crn, uuid, appointmentId } from '../appointments/imports/common'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import OutcomePage from '../../pages/appointmentOutcomes/outcome.page'
import { completeSentencePage, completeTypePage, completeLocationDateTimePage } from '../appointments/utils'
import SendLetterPage from '../../pages/appointmentOutcomes/send-letter.page'
import InitiateBreachOrRecallPage from '../../pages/appointmentOutcomes/initiate-breach-or-recall.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import EnforcementActionPage from '../../pages/appointmentOutcomes/enforcement-action.page'
import { ExpectedOption, checkOptionRedirectsToCorrectPage, checkOptions } from './imports'
import AcceptableAbsencePage from '../../pages/appointmentOutcomes/acceptable-absence.page'

let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage
let acceptableAbsencePage: AcceptableAbsencePage

const loadPage = ({ manageJourney = true, sentenceLength = 25 } = {}): void => {
  const endDate = sentenceLength === 12 ? '2024-12-01' : '2027-01-01'
  cy.task('stubEnableNonCompliance')
  cy.task('stubSentences', { endDate })
  cy.task('stubAppointment', { eventId: '2501192724', isFuture: false })
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
  cy.get(`.govuk-radios__input[value=ACCEPTABLE_ABSENCE]`).click()
  outcomePage.getSubmitBtn().click()
}

type RedirectPages = SendLetterPage | InitiateBreachOrRecallPage | AddNotePage | EnforcementActionPage

const getExpectedOptions = ({ sentenceLength = 25 } = {}): ExpectedOption<RedirectPages>[] => {
  const expectedOptions: ExpectedOption<RedirectPages>[] = [
    { value: 'COURT_LEGAL', text: 'Court / legal', RedirectPage: AddNotePage, redirectPageName: 'Add a note' },
    {
      value: 'EMPLOYMENT',
      text: 'Employment',
      RedirectPage: AddNotePage,
      redirectPageName: 'Add a note',
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'FAMILY_CHILDCARE',
      text: 'Family / childcare',
      RedirectPage: AddNotePage,
      redirectPageName: 'Add a note',
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'HOLIDAY',
      text: 'Holiday',
      RedirectPage: AddNotePage,
      redirectPageName: 'Add a note',
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'MEDICAL',
      text: 'Medical',
      RedirectPage: AddNotePage,
      redirectPageName: 'Add a note',
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'RELIGIOUS',
      text: 'Religious',
      RedirectPage: AddNotePage,
      redirectPageName: 'Add a note',
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'RIC',
      text: 'RIC (remanded in custody)',
      RedirectPage: AddNotePage,
      redirectPageName: 'Add a note',
      redirectPageTitle: 'Add a note',
    },
    {
      value: 'PROFESSIONAL_JUDGEMENT_DECISION',
      text: 'Professional judgement decision',
      RedirectPage: AddNotePage,
      redirectPageName: 'Add a note',
      redirectPageTitle: 'Add a note',
    },
  ]
  if (sentenceLength > 24) {
    expectedOptions.push({
      value: 'ACCEPTABLE_FAILURE',
      text: 'Acceptable failure - none in the following 12 months',
      hint: 'There have been no failures to attend other appointments in the last 12 months.',
      RedirectPage: AddNotePage,
      redirectPageName: 'Add a note',
      redirectPageTitle: 'Add a note',
    })
  }
  return expectedOptions
}

const checkPage = ({ manageJourney = true } = {}) => {
  it('should render the page if sentence length is over 24 months', () => {
    loadPage({ manageJourney })
    acceptableAbsencePage = new AcceptableAbsencePage()
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
    cy.get('legend').should('contain.text', 'Why was Alton’s absence acceptable?')
    const options = getExpectedOptions()
    checkOptions(options)
  })

  it('should render the page if sentence length is 24 months or less', () => {
    loadPage({ manageJourney, sentenceLength: 12 })
    const options = getExpectedOptions({ sentenceLength: 12 })
    checkOptions(options)
  })
  it('should have the correct back link', () => {
    loadPage({ manageJourney })
    const expectedLink = manageJourney
      ? `/case/${crn}/appointments/appointment/${appointmentId}/outcome`
      : `/case/${crn}/arrange-appointment/${uuid}/outcome`
    acceptableAbsencePage.getBackLink().should('have.attr', 'href', expectedLink)
  })
  it('should show validation error when no option is selected', () => {
    const msg = 'Select why their absence was acceptable'
    loadPage({ manageJourney })
    acceptableAbsencePage = new AcceptableAbsencePage()
    acceptableAbsencePage.getSubmitBtn().click()
    acceptableAbsencePage.checkErrorSummaryBox([msg])
    const id = manageJourney ? appointmentId : uuid
    cy.get(`#appointments-${crn}-${id}-outcome-enforcementAction-error`).should('contain.text', msg)
  })
  it('should redirect to the correct page when an option is selected', () => {
    const options = getExpectedOptions()
    checkOptionRedirectsToCorrectPage(options, loadPage, { Page: AcceptableAbsencePage, manageJourney })
  })
}

describe('Acceptable absence', () => {
  before(() => {
    cy.request('POST', '/__test/clear-session')
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
