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
import { ExpectedOption, Journey, checkOptionRedirectsToCorrectPage, checkOptions } from './imports'
import { SentenceType } from '../../../server/data/model/sentenceDetails'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'

let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage
let attendedFailedToComplyPage: AttendedFailedToComplyPage
let checkYourAnswersPage: RescheduleCheckYourAnswerPage
let initiateBreachOrRecallPage: InitiateBreachOrRecallPage
let addNotePage: AddNotePage

const msgs = ['Select who will create the breach NSI', 'Select who will send the letter', 'Select the type of letter']

const loadPage = ({
  journey = 'MANAGE',
  sentenceType = 'COMMUNITY',
  sendLetter = false,
}: { journey?: Journey; sentenceType?: SentenceType; sendLetter?: boolean } = {}): void => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3007/__test/clear-session',
  })
  cy.task('stubEnableNonCompliance')
  cy.task('stubAppointment', { eventId: '2501192724', isFuture: false })
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
  const action = sendLetter ? 'INITIATE_BREACH_RECALL_AND_SEND_LETTER' : 'INITIATE_BREACH_RECALL'
  cy.get(`.govuk-radios__input[value=${action}]`).click()
  attendedFailedToComplyPage.getSubmitBtn().click()
}

type RedirectPages = SendLetterPage | InitiateBreachOrRecallPage | AddNotePage | EnforcementActionPage

type OptionsFor = 'BREACH_CREATED_BY' | 'LETTER_SENT_BY' | 'LETTER_TYPE'
const getExpectedOptions = ({
  optionsFor = 'BREACH_CREATED_BY',
  sentenceType = 'COMMUNITY',
}: { optionsFor?: OptionsFor; sentenceType?: SentenceType } = {}): ExpectedOption<RedirectPages>[] => {
  let expectedOptions: ExpectedOption<RedirectPages>[] = []
  if (optionsFor === 'BREACH_CREATED_BY') {
    const text = sentenceType === 'COMMUNITY' ? 'breach' : 'recall'
    expectedOptions = [
      { value: 'CASE_ADMIN', text: 'Case administrator', hint: 'This will be added to the appointment notes.' },
      {
        value: 'USER',
        text: `I’ll initiate the ${text}`,
      },
    ]
  }
  if (optionsFor === 'LETTER_SENT_BY') {
    expectedOptions = [
      {
        value: 'CASE_ADMIN',
        text: 'Case administrator',
        hint: 'You need to follow your local process to request a letter.',
      },
      {
        value: 'USER',
        text: 'I’ll send the letter',
      },
    ]
  }
  if (optionsFor === 'LETTER_TYPE') {
    expectedOptions = [
      { value: 'LICENCE_COMPLIANCE_LETTER', text: 'Licence compliance letter' },
      { value: 'DIFFERENT_ENFORCEMENT_LETTER', text: 'A different enforcement letter' },
    ]
  }
  return expectedOptions
}

const checkPage = ({ journey = 'MANAGE' }: { journey?: Journey } = {}) => {
  it('should render the page if sentence type is community', () => {
    loadPage({ journey })
    initiateBreachOrRecallPage = new InitiateBreachOrRecallPage()
    initiateBreachOrRecallPage.checkPageTitle('Initiate a breach')
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
    cy.get('legend').should('contain.text', 'Who will create the breach NSI (non-statutory intervention)?')
    const options = getExpectedOptions()
    checkOptions(options)
    cy.get('[data-module="govuk-radios"]').should('have.length', 1)
  })
  it('should render the page if sentence type is custody and enforcement action is send a letter', () => {
    loadPage({ journey, sentenceType: 'CUSTODY', sendLetter: true })
    initiateBreachOrRecallPage = new InitiateBreachOrRecallPage()
    initiateBreachOrRecallPage.checkPageTitle('Initiate a recall and send a letter')
    const options = getExpectedOptions({ sentenceType: 'CUSTODY' })
    checkOptions(options)
    cy.get('legend').eq(1).should('contain.text', 'Who will send the letter?')
    const letterSentByOptions = getExpectedOptions({ optionsFor: 'LETTER_SENT_BY' })
    checkOptions(letterSentByOptions, 1)
    cy.get('legend').eq(2).should('contain.text', 'Select the type of letter')
    const letterTypeOptions = getExpectedOptions({ optionsFor: 'LETTER_TYPE' })
    checkOptions(letterTypeOptions, 2)
    cy.get('[data-module="govuk-radios"]').should('have.length', 3)
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
  it('should show validation error when no option is selected for breach/recall enforcement action', () => {
    const msg = 'Select who will create the breach NSI'
    loadPage({ journey })
    initiateBreachOrRecallPage = new InitiateBreachOrRecallPage()
    initiateBreachOrRecallPage.getSubmitBtn().click()
    initiateBreachOrRecallPage.checkErrorSummaryBox([msg])
    getUuid(3).then(uuid => {
      const id = journey === 'MANAGE' ? appointmentId : uuid
      cy.get(`#appointments-${crn}-${id}-outcome-breachNSICreatedBy-error`).should('contain.text', msg)
    })
  })

  it('should show validation errors when no options are selected for send letter enforcement action', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:3007/__test/clear-session',
    })
    loadPage({ journey, sendLetter: true })
    initiateBreachOrRecallPage = new InitiateBreachOrRecallPage()
    initiateBreachOrRecallPage.getSubmitBtn().click()
    initiateBreachOrRecallPage.checkErrorSummaryBox(msgs)
    getUuid(3).then(uuid => {
      const id = journey === 'MANAGE' ? appointmentId : uuid
      cy.get(`#appointments-${crn}-${id}-outcome-breachNSICreatedBy-error`).should('contain.text', msgs[0])
      cy.get(`#appointments-${crn}-${id}-outcome-letterSentBy-error`).should('contain.text', msgs[1])
      cy.get(`#appointments-${crn}-${id}-outcome-letterType-error`).should('contain.text', msgs[2])
    })
  })
  it('should show validation errors when only the first option is selected for send letter enforcement action', () => {
    loadPage({ journey, sendLetter: true })
    initiateBreachOrRecallPage = new InitiateBreachOrRecallPage()
    cy.get('[data-module="govuk-radios"]').eq(0).find('.govuk-radios__item').eq(0).find('input').click()
    initiateBreachOrRecallPage.getSubmitBtn().click()
    initiateBreachOrRecallPage.checkErrorSummaryBox([msgs[1], msgs[2]])
    getUuid(3).then(uuid => {
      const id = journey === 'MANAGE' ? appointmentId : uuid
      cy.get(`#appointments-${crn}-${id}-outcome-breachNSICreatedBy-error`).should('not.exist')
      cy.get(`#appointments-${crn}-${id}-outcome-letterSentBy-error`).should('contain.text', msgs[1])
      cy.get(`#appointments-${crn}-${id}-outcome-letterType-error`).should('contain.text', msgs[2])
    })
  })
  it('should redirect to the correct page when an option is selected', () => {
    loadPage({ journey })
    cy.get('.govuk-radios__item').eq(0).find('input').click()
    initiateBreachOrRecallPage.getSubmitBtn().click()
    addNotePage = new AddNotePage()
    addNotePage.checkOnPage()
  })
  it('should redirect to the correct page when all options are selected for send letter enforcement action', () => {
    loadPage({ journey, sendLetter: true })
    cy.get('[data-module="govuk-radios"]').eq(0).find('.govuk-radios__item').eq(0).find('input').click()
    cy.get('[data-module="govuk-radios"]').eq(1).find('.govuk-radios__item').eq(0).find('input').click()
    cy.get('[data-module="govuk-radios"]').eq(2).find('.govuk-radios__item').eq(0).find('input').click()
    initiateBreachOrRecallPage.getSubmitBtn().click()
    addNotePage = new AddNotePage()
    addNotePage.checkOnPage()
  })
}

describe('Initiate a breach or recall', () => {
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
