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
} from '../appointments/utils'
import OutcomePage from '../../pages/appointmentOutcomes/outcome.page'
import AttendedFailedToComplyPage from '../../pages/appointmentOutcomes/attended-failed-to-comply.page'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'

let addNotePage: AddNotePage
let manageAppointmentPage: ManageAppointmentPage
let outcomePage: OutcomePage
let attendedFailedToComplyPage: AttendedFailedToComplyPage
let checkYourAnswersPage: RescheduleCheckYourAnswerPage

type Journey = 'MANAGE' | 'ARRANGE' | 'RESCHEDULE'

const loadPage = ({ journey = 'MANAGE' }: { journey?: Journey } = {}): void => {
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
  outcomePage = new OutcomePage()
  cy.get(`.govuk-radios__input[value=ATTENDED_SENT_HOME_BEHAVIOUR]`).click()
  outcomePage.getSubmitBtn().click()
  attendedFailedToComplyPage = new AttendedFailedToComplyPage()
  cy.get(`.govuk-radios__input[value=NO_FURTHER_ACTION]`).click()
  attendedFailedToComplyPage.getSubmitBtn().click()
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
        const cyaPage = new AppointmentCheckYourAnswersPage()
        cyaPage.checkPageTitle('Check your answers')
        // cy.url().should('include', '/manage')
      })
    })
  }
  it('submits successfully with no notes or upload and sensitivity selected', () => {
    loadPage({ journey })
    addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
    addNotePage.getSubmitBtn().click()
    checkYourAnswersPage = new AppointmentCheckYourAnswersPage()
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
