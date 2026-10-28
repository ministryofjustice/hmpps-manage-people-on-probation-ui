import { DateTime } from 'luxon'
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
import { ExpectedOption, Journey, checkOptionRedirects, checkOptions } from './imports'
import AcceptableAbsencePage from '../../pages/appointmentOutcomes/acceptable-absence.page'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'
import { SentenceType } from '../../../server/data/model/sentenceDetails'
import { dateWithDayAndWithYear } from '../../../server/utils'

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
  it('should complete the acceptable absence journey', () => {
    loadPage({ journey })
    acceptableAbsencePage = new AcceptableAbsencePage()

    // journey-specific appointment hint, built by the controller
    let expectedAppointment = '3 way meeting (NS) with Terry Jones on Wednesday 21 February 2024'
    const expectedDate = dateWithDayAndWithYear(DateTime.now().minus({ days: 1 }).toISODate())
    if (journey === 'ARRANGE') {
      expectedAppointment = `Planned office visit (NS) with Deborah Fern on ${expectedDate}`
    }
    if (journey === 'RESCHEDULE') {
      expectedAppointment = `3 way meeting (NS) with Terry Jones on ${expectedDate}`
    }
    cy.get('.govuk-hint').should('contain.text', `Appointment: ${expectedAppointment}.`)

    // sentence over 24 months includes the acceptable failure option
    cy.get('.govuk-radios__input[value=ACCEPTABLE_FAILURE]').should('exist')

    getUuid(3).then(uuid => {
      const expectedLink =
        journey === 'MANAGE'
          ? `/case/${crn}/appointments/appointment/${appointmentId}/outcome`
          : `/case/${crn}/arrange-appointment/${uuid}/outcome`
      acceptableAbsencePage.getBackLink().should('have.attr', 'href', expectedLink)
    })

    checkOptionRedirects(getExpectedOptions(), AcceptableAbsencePage)

    // validation error (after redirects, as the error render is a POST response)
    const msg = 'Select why their absence was acceptable'
    uncheckAllRadios()
    acceptableAbsencePage.getSubmitBtn().click()
    acceptableAbsencePage.checkErrorSummaryBox([msg])
    getUuid(3).then(uuid => {
      const id = journey === 'MANAGE' ? appointmentId : uuid
      cy.get(`#appointments-${crn}-${id}-outcome-acceptableAbsence-error`).should('contain.text', msg)
    })
  })
}

describe('Acceptable absence', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  afterEach(() => {
    cy.task('resetMocks')
  })
  describe('Manage appointment journey', () => {
    checkPage()
    it('should not show the acceptable failure option if sentence length is 24 months or less', () => {
      loadPage({ sentenceLength: 12 })
      checkOptions(getExpectedOptions({ sentenceLength: 12 }))
      cy.get('.govuk-radios__input[value=ACCEPTABLE_FAILURE]').should('not.exist')
    })
  })
  describe('Arrange appointment journey', () => {
    checkPage({ journey: 'ARRANGE' })
  })
  describe('Reschedule appointment journey', () => {
    checkPage({ journey: 'RESCHEDULE' })
  })
})
