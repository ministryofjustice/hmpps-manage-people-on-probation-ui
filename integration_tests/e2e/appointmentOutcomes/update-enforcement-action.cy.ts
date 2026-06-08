import { SentenceType } from '../../../server/data/model/sentenceDetails'
import { AppointmentEnforcementAction } from '../../../server/models/Appointments'
import { enforcementActionMap } from '../../../server/properties/appointment-outcomes/code-map'
import EnforcementActionPage from '../../pages/appointmentOutcomes/enforcement-action.page'
import InitiateBreachOrRecallPage from '../../pages/appointmentOutcomes/initiate-breach-or-recall.page'
import SendLetterPage from '../../pages/appointmentOutcomes/send-letter.page'
import UpdateEnforcementActionPage from '../../pages/appointmentOutcomes/update-enforcement-action.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import { checkPopHeader } from '../appointments/imports'
import { crn, appointmentId } from '../appointments/imports/common'
import {
  checkBreachOrRecallWarningBanner,
  checkOptionRedirectsToCorrectPage,
  checkOptions,
  ExpectedOption,
} from './imports'

let manageAppointmentPage: ManageAppointmentPage
let updateEnforcementActionPage: UpdateEnforcementActionPage
let enforcementActionPage: EnforcementActionPage

const loadPage = ({
  sentenceType = 'COMMUNITY',
  acceptableAbsence = false,
  enforcementAction = 'FIRST_WARNING_LETTER_SENT',
}: {
  sentenceType?: SentenceType
  acceptableAbsence?: boolean
  enforcementAction?: AppointmentEnforcementAction
} = {}): void => {
  const action = enforcementActionMap?.[enforcementAction]?.description || null
  const code = enforcementActionMap?.[enforcementAction]?.code || null
  cy.task('stubAppointment', {
    eventId: 2501192724,
    isFuture: false,
    hasOutcome: true,
    hasComplied: true,
    notes: false,
    acceptableAbsence,
    action,
    outcome: action ? 'Attended - Failed To Comply' : null,
    enforcementAction: {
      code,
      description: action,
    },
  })
  if (sentenceType !== 'COMMUNITY') {
    cy.task('stubSentences', { sentenceType })
  }
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
  manageAppointmentPage = new ManageAppointmentPage()
  manageAppointmentPage.getTaskLink(2).click()
}

type RedirectPages = SendLetterPage | AddNotePage | EnforcementActionPage

const getExpectedOptions = ({
  action = 'FIRST_WARNING_LETTER_SENT',
  acceptableAbsence = false,
  sentenceType = 'COMMUNITY',
}: {
  action?: AppointmentEnforcementAction
  acceptableAbsence?: boolean
  sentenceType?: SentenceType
} = {}): ExpectedOption<RedirectPages>[] => {
  const text = sentenceType === 'COMMUNITY' ? 'breach' : 'recall'
  const expectedOptions: ExpectedOption<RedirectPages>[] = []

  if (action === 'FIRST_WARNING_LETTER_SENT' && !acceptableAbsence) {
    expectedOptions.push(
      {
        value: 'SEND_ANOTHER_LETTER',
        text: 'Send another letter',
        RedirectPage: SendLetterPage,
        redirectPageTitle: 'Send a letter',
      },
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
        redirectPageTitle: `Initiate a ${text} and send a letter`,
      },
      {
        value: 'WITHDRAW_WARNING_LETTER',
        text: `Withdraw warning letter`,
        RedirectPage: AddNotePage,
        redirectPageTitle: 'Add a note',
      },
    )
  }
  if (action === 'BREACH_RECALL_INITIATED' && sentenceType === 'COMMUNITY' && !acceptableAbsence) {
    expectedOptions.push(
      {
        value: 'BREACH_REQUESTED',
        text: 'Breach requested',
        RedirectPage: AddNotePage,
        redirectPageTitle: 'Add a note',
      },
      {
        value: 'BREACH_CONFIRMATION_SENT',
        text: 'Breach confirmation sent',
        RedirectPage: AddNotePage,
        redirectPageTitle: 'Add a note',
      },
      {
        value: 'BREACH_LETTER_SENT',
        text: 'Breach letter sent',
        RedirectPage: AddNotePage,
        redirectPageTitle: 'Add a note',
      },
      {
        value: 'BREACH_REQUEST_ACTIONED',
        text: 'Breach request actioned',
        RedirectPage: AddNotePage,
        redirectPageTitle: 'Add a note',
      },
      {
        value: 'WITHDRAW_WARNING_LETTER',
        text: 'Withdraw warning letter',
        RedirectPage: AddNotePage,
        redirectPageTitle: 'Add a note',
      },
    )
  }
  if (
    ['DECISION_PENDING_RESPONSE', 'REFER_TO_OFFENDER_MANAGER', 'YOT_OM_NOTIFIED'].includes(action) &&
    !acceptableAbsence
  ) {
    expectedOptions.push(
      {
        value: 'SEND_LETTER',
        text: 'Send a letter',
        RedirectPage: SendLetterPage,
        redirectPageTitle: 'Send a letter',
      },
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
        redirectPageTitle: `Initiate a ${text} and send a letter`,
      },
    )
  }
  if (
    ['BREACH_RECALL_INITIATED', 'RECALL_REQUESTED', 'IMMEDIATE_BREACH_OR_RECALL'].includes(action) &&
    !acceptableAbsence &&
    sentenceType === 'CUSTODY'
  ) {
    expectedOptions.push(
      {
        value: 'RECALL_REQUESTED',
        text: 'Recall requested',
        RedirectPage: AddNotePage,
        redirectPageTitle: 'Add a note',
      },
      {
        value: 'WITHDRAW_WARNING_LETTER',
        text: 'Withdraw warning letter',
        RedirectPage: AddNotePage,
        redirectPageTitle: 'Add a note',
      },
    )
  }
  if (acceptableAbsence) {
    expectedOptions.push({
      value: 'WITHDRAW_WARNING_LETTER',
      text: 'Withdraw warning letter',
      RedirectPage: AddNotePage,
      redirectPageTitle: 'Add a note',
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

const checkCurrentEnforcementStatus = ({
  colour = 'yellow',
  text = 'First Warning Letter Sent',
}: { colour?: string; text?: string } = {}) => {
  cy.get('.govuk-inset-text').should('contain.text', 'The current enforcement status is:')
  cy.get('.govuk-inset-text').find(`.govuk-tag--${colour}`).should('contain.text', text)
}

const checkPage = () => {
  describe('Current enforcement action is letter related and sentence type is COMMUNITY', () => {
    const options = getExpectedOptions()
    const enforcementAction = 'FIRST_WARNING_LETTER_SENT'
    it('should have the correct back link', () => {
      loadPage()
      updateEnforcementActionPage = new UpdateEnforcementActionPage()
      const expectedLink = `/case/${crn}/appointments/appointment/${appointmentId}/manage`
      updateEnforcementActionPage.getBackLink().should('have.attr', 'href', expectedLink)
    })
    it('should render the page', () => {
      loadPage({ enforcementAction })
      updateEnforcementActionPage = new UpdateEnforcementActionPage()
      checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })
      updateEnforcementActionPage.checkPageTitle('Update enforcement action for Alton’s failure to comply')
      checkCurrentEnforcementStatus()
      cy.get('legend').should('contain.text', 'Select an action for Alton’s failure to comply')
      checkOptions(options)
    })
    it('should redirect to the correct page when an option is selected', () => {
      checkOptionRedirectsToCorrectPage(options, loadPage, {
        Page: UpdateEnforcementActionPage,
        action: enforcementAction,
        sentenceType: 'COMMUNITY',
      })
    })
  })

  describe('Current enforcement action is breach related and sentence type is COMMUNITY', () => {
    const enforcementAction = 'BREACH_RECALL_INITIATED'
    const options = getExpectedOptions({ action: enforcementAction })
    it('should render the page', () => {
      loadPage({ enforcementAction })
      updateEnforcementActionPage = new UpdateEnforcementActionPage()
      updateEnforcementActionPage.checkPageTitle('Update enforcement action for Alton’s failure to comply')
      checkCurrentEnforcementStatus({ text: 'Breach / Recall Initiated' })
      cy.get('legend').should('contain.text', 'Select an action for Alton’s failure to comply')
      checkOptions(options)
    })
    it('should redirect to the correct page when an option is selected', () => {
      checkOptionRedirectsToCorrectPage(options, loadPage, {
        Page: UpdateEnforcementActionPage,
        enforcementAction,
        sentenceType: 'COMMUNITY',
      })
    })
  })

  describe('Current enforcement action is recall related and sentence type is CUSTODY', () => {
    const enforcementAction = 'BREACH_RECALL_INITIATED'
    const options = getExpectedOptions({ action: enforcementAction, sentenceType: 'CUSTODY' })
    it('should render the page', () => {
      loadPage({ enforcementAction, sentenceType: 'CUSTODY' })
      updateEnforcementActionPage = new UpdateEnforcementActionPage()
      updateEnforcementActionPage.checkPageTitle('Update enforcement action for Alton’s failure to comply')
      checkCurrentEnforcementStatus({ text: 'Breach / Recall Initiated' })
      cy.get('legend').should('contain.text', 'Select an action for Alton’s failure to comply')
      checkOptions(options)
    })
    it('should redirect to the correct page when an option is selected', () => {
      checkOptionRedirectsToCorrectPage(options, loadPage, {
        Page: UpdateEnforcementActionPage,
        enforcementAction,
        sentenceType: 'CUSTODY',
      })
    })
  })

  const pendingActions: AppointmentEnforcementAction[] = [
    'DECISION_PENDING_RESPONSE',
    'REFER_TO_OFFENDER_MANAGER',
    'YOT_OM_NOTIFIED',
  ]
  pendingActions.forEach(action => {
    const options = getExpectedOptions({ action, sentenceType: 'CUSTODY' })
    const sentenceType = 'CUSTODY'
    describe(`current enforcement action is pending with action ${action} and sentence type is ${sentenceType}`, () => {
      it(`should render the page`, () => {
        loadPage({ sentenceType, enforcementAction: action })
        updateEnforcementActionPage = new UpdateEnforcementActionPage()
        updateEnforcementActionPage.checkPageTitle('Update enforcement action for Alton’s failure to comply')
        cy.get('legend').should('contain.text', 'Select an action for Alton’s failure to comply')
        checkOptions(options)
      })
      it('should redirect to the correct page when an option is selected', () => {
        checkOptionRedirectsToCorrectPage(options, loadPage, {
          Page: UpdateEnforcementActionPage,
          enforcementAction: action,
          sentenceType,
        })
      })
    })
  })

  describe('Current enforcement action is other enforcement action', () => {
    it('should redirect to the other enforcement action page', () => {
      loadPage({ enforcementAction: 'NO_FURTHER_ACTION' })
      enforcementActionPage = new EnforcementActionPage()
      enforcementActionPage.checkPageTitle('Select an enforcement action for Alton’s failure to comply')
      checkCurrentEnforcementStatus({ colour: 'green', text: 'No Further Action' })
    })
  })

  describe('Current enforcement action is WITHDRAWAL_OF_WARNING', () => {
    it('should render the page', () => {
      loadPage({ enforcementAction: 'WITHDRAWAL_OF_WARNING' })
      checkCurrentEnforcementStatus({ colour: 'green', text: 'Withdrawal of Warning' })
    })
  })

  describe('Outcome is acceptable absence', () => {
    const acceptableAbsence = true
    const options = getExpectedOptions({ acceptableAbsence })
    it('should render the page if outcome is acceptable absence', () => {
      loadPage({ acceptableAbsence })
      updateEnforcementActionPage = new UpdateEnforcementActionPage()
      updateEnforcementActionPage.checkPageTitle('Update enforcement action for Alton’s acceptable absence')
      cy.get('legend').should('contain.text', 'Select an action for Alton’s acceptable absence')
      checkOptions(options)
    })
    it('should redirect to the correct page when an option is selected', () => {
      checkOptionRedirectsToCorrectPage(options, loadPage, {
        Page: UpdateEnforcementActionPage,
        acceptableAbsence,
      })
    })
  })

  describe('No enforcement action option is selected', () => {
    it('should show a validation error', () => {
      const msg = 'Select another enforcement action'
      loadPage()
      updateEnforcementActionPage = new UpdateEnforcementActionPage()
      updateEnforcementActionPage.getSubmitBtn().click()
      updateEnforcementActionPage.checkErrorSummaryBox([msg])
      cy.get(`#appointments-${crn}-${appointmentId}-outcome-updateEnforcementAction-error`).should('contain.text', msg)
    })
  })

  checkBreachOrRecallWarningBanner(loadPage, { Page: UpdateEnforcementActionPage })
}

describe('Update enforcement action', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  afterEach(() => {
    cy.task('resetMocks')
  })
  describe('Manage appointment journey', () => {
    checkPage()
  })
})
