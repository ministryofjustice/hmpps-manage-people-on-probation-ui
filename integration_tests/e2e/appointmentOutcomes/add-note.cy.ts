import 'cypress-file-upload'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import AddNotePage from '../../pages/appointmentOutcomes/add-note.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import config from '../../../server/config'
import { appointmentId } from '../appointments/imports/common'
import {
  completeSentencePage,
  completeTypePage,
  completeLocationDateTimePage,
  completeRescheduleAppointmentPage,
  getUuid,
  completeOutcome,
} from '../appointments/utils'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import { AppointmentEnforcementAction, AppointmentOutcomeType } from '../../../server/models/Appointments'

let addNotePage: AddNotePage
let manageAppointmentPage: ManageAppointmentPage
let checkYourAnswersPage: RescheduleCheckYourAnswerPage
let nextAppointmentPage: NextAppointmentPage

type Journey = 'MANAGE' | 'ARRANGE' | 'RESCHEDULE'

const loadPage = ({
  journey = 'MANAGE',
  outcome = 'ATTENDED_SENT_HOME_BEHAVIOUR',
  action = 'NO_FURTHER_ACTION',
  isSensitive = false,
}: {
  journey?: Journey
  outcome?: AppointmentOutcomeType
  action?: AppointmentEnforcementAction
  isSensitive?: boolean
} = {}): void => {
  if (isSensitive) {
    cy.task('stubAppointment', { isSensitive: true, isFuture: false })
  }
  const crn = journey === 'ARRANGE' ? 'X778160' : 'X000001'
  if (journey === 'ARRANGE') {
    completeSentencePage()
    completeTypePage()
    completeLocationDateTimePage({ dateInPast: true })
  }
  if (journey === 'MANAGE') {
    cy.visit('/case/X000001/appointments/appointment/6/manage')
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getTaskLink(1).click()
  }
  if (journey === 'RESCHEDULE') {
    completeRescheduleAppointmentPage({ crn })
    checkYourAnswersPage = new RescheduleCheckYourAnswerPage()
    checkYourAnswersPage.getSubmitBtn().click()
    getUuid(2).then(pageUuid => {
      completeLocationDateTimePage({ dateInPast: true, uuidOveride: pageUuid, crnOverride: crn })
    })
  }
  completeOutcome({ outcome, action })
  addNotePage = new AddNotePage()
}

const createFakeFile = (mb: number, type: string): Cypress.FixtureData => {
  const fileSize = mb * 1024 * 1024
  const fileContent = new Blob(['a'.repeat(fileSize)], { type: 'text/plain' })
  const fileName = `fake${mb}mb.${type}`
  const mimeType = Object.keys(config.validMimeTypes).includes(type)
    ? config.validMimeTypes[type]
    : `application/${type}`
  return { fileContent, fileName, mimeType }
}

const checkValidation = ({ journey = 'MANAGE' }: { journey?: Journey } = {}): void => {
  const crn = journey === 'ARRANGE' ? 'X778160' : 'X000001'
  it('shows error when sensitivity is not selected', () => {
    loadPage({ journey })
    getUuid(3).then(uuid => {
      const id = journey === 'MANAGE' ? appointmentId : uuid
      cy.get(`#appointments-${crn}-${id}-notes`).type('x'.repeat(20), { delay: 0 })
      addNotePage.getSubmitBtn().click()
      addNotePage.checkErrorSummaryBox(['Select whether or not the appointment note contains sensitive information'])
      addNotePage
        .getElement(`#appointments-${crn}-${id}-sensitivity-error`)
        .should('contain.text', 'Select whether or not the appointment note contains sensitive information')
    })
  })
  it('shows error when note exceeds 12000 characters', () => {
    loadPage({ journey })
    getUuid(3).then(uuid => {
      const id = journey === 'MANAGE' ? appointmentId : uuid
      cy.get(`#appointments-${crn}-${id}-notes`).type('x'.repeat(12001), { delay: 0 })
      addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
      addNotePage.getSubmitBtn().click()
      addNotePage.checkErrorSummaryBox(['Note must be 12000 characters or less'])
      cy.get('.govuk-character-count__status').should('contain.text', 'You have 1 character too many')
    })
  })
}

const checkPage = ({ journey = 'MANAGE' }: { journey?: Journey } = {}) => {
  const crn = journey === 'ARRANGE' ? 'X778160' : 'X000001'
  it('renders the page', () => {
    loadPage({ journey })
    getUuid(3).then(uuid => {
      cy.get('.govuk-back-link').should('not.exist')
      cy.contains('Use paragraphs and formatting').should('be.visible')
      cy.get('[data-qa="crissButton"]').should('contain.text', 'Show CRISS headers')
      const id = journey === 'MANAGE' ? appointmentId : uuid
      cy.get(`textarea#appointments-${crn}-${id}-notes`).should('have.value', '')
      if (journey === 'MANAGE') {
        cy.get('label[for="fileUpload"]').should('contain.text', 'Upload a file (optional)')
        cy.get('.guidance-panel').should('not.exist')
      }
    })
  })
  if (journey === 'MANAGE') {
    it('adds CRISS headers when textarea is empty', () => {
      loadPage({ journey })
      getUuid(3).then(uuid => {
        const id = journey === 'MANAGE' ? appointmentId : uuid
        addNotePage.getCrissButton().click()
        cy.get(`textarea#appointments-${crn}-${id}-notes`).should(
          'have.value',
          'Check in\n\nReview\n\nIntervention\n\nSummarise\n\nSet tasks',
        )
      })
    })
    it('does not overwrite existing notes with CRISS headers', () => {
      loadPage({ journey })
      getUuid(3).then(uuid => {
        const id = journey === 'MANAGE' ? appointmentId : uuid
        cy.get(`textarea#appointments-${crn}-${id}-notes`).type('Some notes')
        addNotePage.getCrissButton().click()
        cy.get(`textarea#appointments-${crn}-${id}-notes`).should('have.value', 'Some notes')
      })
    })
    it('should not display the sensitivity question if already set to true', () => {
      loadPage({ journey, isSensitive: true })
      addNotePage.getSensitiveInformation().should('not.exist')
    })
    checkValidation({ journey })
  }

  if (journey === 'ARRANGE') {
    it('does not show file upload', () => {
      loadPage({ journey })
      cy.get('[data-qa="fileUpload"]').should('not.exist')
    })
    it('redirects to check your answers page', () => {
      loadPage({ journey })
      addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
      addNotePage.getSubmitBtn().click()
      const cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.checkPageTitle('Check your answers')
    })
  }
  if (journey === 'MANAGE') {
    it('rejects files larger than 5mb', () => {
      loadPage({ journey })
      addNotePage.getFileUploadInput().attachFile(createFakeFile(6, 'pdf'))
      addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
      addNotePage.getSubmitBtn().click()
      addNotePage.checkErrorSummaryBox(['File size must be 5mb or under'])
    })
    ;(['pdf', 'doc', 'docx'] as const).forEach(filetype => {
      it(`uploads a valid ${filetype} file`, () => {
        cy.task('stubPatchDocument200Response')
        cy.intercept('POST', '/case/*/appointments/appointment/*/outcome/add-note').as('submit')
        loadPage({ journey })
        addNotePage.getFileUploadInput().attachFile(createFakeFile(1, filetype))
        cy.get('textarea').type('Test note')
        addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
        addNotePage.getSubmitBtn().click()
        cy.wait('@submit')
        nextAppointmentPage = new NextAppointmentPage()
        nextAppointmentPage.checkPageTitle(`Eula’s next supervision appointment`)
      })
    })
    it('should display the prepended note inset text if breach action', () => {
      loadPage({ journey, action: 'BREACH_RECALL_INITIATED' })
      cy.get('.guidance-panel')
        .should('be.visible')
        .should('be.visible')
        .should('contain.text', 'Manage people on probation will automatically add this update:')
        .should('contain.text', 'I will initiate the breach')
    })
    it('should display the prepended note inset text if letter action', () => {
      loadPage({ journey, action: 'SEND_LETTER' })
      cy.get('.guidance-panel')
        .should('be.visible')
        .should('contain.text', 'Manage people on probation will automatically add this update:')
        .should('contain.text', 'I will send a first warning letter')
    })
    it('should display the prepended note inset text if breach and letter action', () => {
      loadPage({ journey, action: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' })
      cy.get('.guidance-panel')
        .should('be.visible')
        .should('contain.text', 'Manage people on probation will automatically add this update:')
        .should('contain.text', 'I will initiate the breach')
        .should('contain.text', 'I will send a licence compliance letter')
    })
  }
  it('submits successfully with no notes or upload and sensitivity selected', () => {
    loadPage({ journey })
    addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
    addNotePage.getSubmitBtn().click()
    nextAppointmentPage = new NextAppointmentPage()
  })
}

describe('Add a note', () => {
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
