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
import AddNotePage from '../../pages/appointments/add-note.page'
import { ExpectedOption, Journey, checkBreachOrRecallWarningBanner, checkOptions } from './imports'
import { SentenceType } from '../../../server/data/model/sentenceDetails'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'
import { AppointmentEnforcementAction } from '../../../server/models/Appointments'
import EnforcementActionPage from '../../pages/appointmentOutcomes/enforcement-action.page'

let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage
let attendedFailedToComplyPage: AttendedFailedToComplyPage
let checkYourAnswersPage: RescheduleCheckYourAnswerPage
let sendLetterPage: SendLetterPage
let addNotePage: AddNotePage
let otherEnforcmentActionPage: EnforcementActionPage

const msgs = ['Select who will send the letter', 'Select the type of letter']

const loadPage = ({
  journey = 'MANAGE',
  sentenceType = 'COMMUNITY',
  action = 'SEND_LETTER',
  description = '12 month Community order',
  pss = false,
}: {
  journey?: Journey
  sentenceType?: SentenceType
  action?: AppointmentEnforcementAction
  description?: string
  pss?: boolean
} = {}): void => {
  cy.task('stubAppointment', { eventId: '2501192724', isFuture: false })
  if (sentenceType !== 'COMMUNITY') {
    cy.task('stubSentences', { sentenceType, description, pss })
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
  cy.get(`.govuk-radios__input[value=ATTENDED_FAILED_TO_COMPLY]`).click()
  outcomePage.getSubmitBtn().click()
  attendedFailedToComplyPage = new AttendedFailedToComplyPage()
  cy.get(`.govuk-radios__input[value=${action}]`).click()
  attendedFailedToComplyPage.getSubmitBtn().click()
  if (action === 'DIFFERENT_ACTION') {
    otherEnforcmentActionPage = new EnforcementActionPage()
    cy.get('select').select('BREACH_LETTER_SENT')
    otherEnforcmentActionPage.getSubmitBtn().click()
  }
}

type RedirectPages = AddNotePage

type OptionsFor = 'LETTER_SENT_BY' | 'LETTER_TYPE'

const getExpectedOptions = ({
  optionsFor = 'LETTER_SENT_BY',
  sentenceType = 'COMMUNITY',
  youth = false,
  pss = false,
}: {
  optionsFor?: OptionsFor
  sentenceType?: SentenceType
  youth?: boolean
  pss?: boolean
} = {}): ExpectedOption<RedirectPages>[] => {
  let expectedOptions: ExpectedOption<RedirectPages>[] = []
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
    if (sentenceType === 'CUSTODY' && !youth && !pss) {
      expectedOptions.push({ value: 'LICENCE_COMPLIANCE_LETTER_SENT', text: 'Licence compliance letter' })
    }
    if (sentenceType === 'COMMUNITY') {
      expectedOptions.push(
        { value: 'FIRST_WARNING_LETTER_SENT', text: 'First warning letter' },
        { value: 'BREACH_LETTER_SENT', text: 'Breach warning letter' },
      )
    }
    if (pss || youth) {
      expectedOptions.push(
        { value: 'FIRST_WARNING_LETTER_SENT', text: 'First warning letter' },
        { value: 'SECOND_WARNING_LETTER_SENT', text: 'Second warning letter' },
        { value: 'BREACH_LETTER_SENT', text: 'Breach warning letter' },
      )
    }
    expectedOptions.push({ value: 'OTHER_ENFORCEMENT_LETTER_SENT', text: 'A different enforcement letter' })
  }
  return expectedOptions
}

const checkPage = ({ journey = 'MANAGE' }: { journey?: Journey } = {}) => {
  it('should render the page if sentence type is COMMUNITY', () => {
    loadPage({ journey })
    sendLetterPage = new SendLetterPage()
    sendLetterPage.checkPageTitle('Send a letter')
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
    cy.get('fieldset').eq(0).find('legend').should('contain.text', 'Who will send the letter?')
    const letterSentByOptions = getExpectedOptions()
    checkOptions(letterSentByOptions)
    cy.get('fieldset').eq(1).find('legend').should('contain.text', 'Select the type of letter')
    const letterTypeOptions = getExpectedOptions({ optionsFor: 'LETTER_TYPE' })
    checkOptions(letterTypeOptions, 1)
    cy.get('[data-module="govuk-radios"]').should('have.length', 2)
  })
  it('should render the page if sentence type is CUSTODY', () => {
    loadPage({ journey, sentenceType: 'CUSTODY' })
    sendLetterPage = new SendLetterPage()
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
    cy.get('legend').should('contain.text', 'Who will send the letter?')
    const letterSentByOptions = getExpectedOptions({ sentenceType: 'CUSTODY' })
    checkOptions(letterSentByOptions)
    const letterTypeOptions = getExpectedOptions({ optionsFor: 'LETTER_TYPE', sentenceType: 'CUSTODY' })
    checkOptions(letterTypeOptions, 1)
    cy.get('[data-module="govuk-radios"]').should('have.length', 2)
  })

  it('should render the page if youth custody sentence', () => {
    loadPage({ journey, sentenceType: 'CUSTODY', description: '204 C JA - Youth Rehabilitation Order' })
    sendLetterPage = new SendLetterPage()
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
    const letterSentByOptions = getExpectedOptions({ sentenceType: 'CUSTODY' })
    checkOptions(letterSentByOptions)
    const letterTypeOptions = getExpectedOptions({ sentenceType: 'CUSTODY', optionsFor: 'LETTER_TYPE', youth: true })
    checkOptions(letterTypeOptions, 1)
    cy.get('[data-module="govuk-radios"]').should('have.length', 2)
  })

  it('should render the page if pss sentence', () => {
    loadPage({ journey, sentenceType: 'CUSTODY', pss: true })
    sendLetterPage = new SendLetterPage()
    checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
    const letterSentByOptions = getExpectedOptions({ sentenceType: 'CUSTODY' })
    checkOptions(letterSentByOptions)
    const letterTypeOptions = getExpectedOptions({ sentenceType: 'CUSTODY', optionsFor: 'LETTER_TYPE', pss: true })
    checkOptions(letterTypeOptions, 1)
    cy.get('[data-module="govuk-radios"]').should('have.length', 2)
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
  it('should show validation errors when no options are selected', () => {
    loadPage({ journey })
    sendLetterPage = new SendLetterPage()
    sendLetterPage.getSubmitBtn().click()
    sendLetterPage.checkErrorSummaryBox([msgs[0], msgs[1]])
    getUuid(3).then(uuid => {
      const id = journey === 'MANAGE' ? appointmentId : uuid
      cy.get(`#appointments-${crn}-${id}-outcome-letterSentBy-error`).should('contain.text', msgs[0])
      cy.get(`#appointments-${crn}-${id}-outcome-letterType-error`).should('contain.text', msgs[1])
    })
  })
  it('should redirect to the add note page when all options are selected', () => {
    loadPage({ journey })
    cy.get('[data-module="govuk-radios"]').eq(0).find('.govuk-radios__item').eq(0).find('input').click()
    cy.get('[data-module="govuk-radios"]').eq(1).find('.govuk-radios__item').eq(0).find('input').click()
    sendLetterPage.getSubmitBtn().click()
    addNotePage = new AddNotePage()
    addNotePage.checkOnPage()
  })
  it('should render the page if other letter type action selected', () => {
    loadPage({ journey, action: 'DIFFERENT_ACTION' })
    sendLetterPage = new SendLetterPage()
    cy.get('[data-qa=letterType]').should('not.exist')
    cy.get('[data-module="govuk-radios"]').eq(0).find('.govuk-radios__item').eq(0).find('input').click()
    sendLetterPage.getSubmitBtn().click()
    addNotePage = new AddNotePage()
    addNotePage.checkOnPage()
  })
  checkBreachOrRecallWarningBanner(loadPage, SendLetterPage)
}

describe('Send a letter', () => {
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
    checkPage({ journey: 'ARRANGE' })
  })
  describe('Reschedule appointment journey', () => {
    checkPage({ journey: 'RESCHEDULE' })
  })
})
