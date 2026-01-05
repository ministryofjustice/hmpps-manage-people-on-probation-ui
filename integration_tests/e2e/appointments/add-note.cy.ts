import 'cypress-file-upload'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import config from '../../../server/config'
import {
  completeAttendedCompliedPage,
  completeLocationDateTimePage,
  completeSentencePage,
  completeTypePage,
  crn,
  uuid,
} from './imports'

describe('Add a note', () => {
  let manageAppointmentPage: ManageAppointmentPage
  let addNotePage: AddNotePage

  beforeEach(() => {
    cy.task('resetMocks')
  })

  /* ------------------------------------------------------------------ */
  /* Helpers                                                            */
  /* ------------------------------------------------------------------ */

  const createFakeFile = (mb: number, type: string): Cypress.FixtureData => {
    const fileSize = mb * 1024 * 1024
    const fileContent = new Blob(['a'.repeat(fileSize)], { type: 'text/plain' })
    const fileName = `fake${mb}mb.${type}`
    const mimeType = Object.keys(config.validMimeTypes).includes(type)
      ? config.validMimeTypes[type]
      : `application/${type}`

    return { fileContent, fileName, mimeType }
  }

  const checkValidation = (loadPage: () => void, manageJourney = false): void => {
    const idPrefix = manageJourney ? '' : `appointments-${crn}-${uuid}-`

    it('shows error when sensitivity is not selected', () => {
      loadPage()
      cy.get(`#${idPrefix}notes`).type('x'.repeat(4000), { delay: 0 })
      addNotePage.getSubmitBtn().click()

      addNotePage.checkErrorSummaryBox(['Select whether or not the appointment note contains sensitive information'])

      addNotePage
        .getElement(`#${idPrefix}sensitivity-error`)
        .should('contain.text', 'Select whether or not the appointment note contains sensitive information')
    })

    it('shows error when note exceeds 12000 characters', () => {
      loadPage()
      cy.get(`#${idPrefix}notes`).type('x'.repeat(12001), { delay: 0 })
      addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
      addNotePage.getSubmitBtn().click()

      addNotePage.checkErrorSummaryBox(['Note must be 12000 characters or less'])
      cy.get('.govuk-character-count__status').should('contain.text', 'You have 1 character too many')
    })
  }

  /* ------------------------------------------------------------------ */
  /* Manage appointment                                                  */
  /* ------------------------------------------------------------------ */

  describe('Manage appointment', () => {
    const loadPage = (): void => {
      cy.visit('/case/X000001/appointments/appointment/6/manage')
      manageAppointmentPage = new ManageAppointmentPage()
      manageAppointmentPage.getTaskLink(2).click()
      addNotePage = new AddNotePage()
    }

    it('renders the page correctly', () => {
      loadPage()

      cy.get('.govuk-back-link').should('not.exist')
      cy.contains('Use paragraphs and formatting').should('be.visible')
      cy.get('[data-qa="crissButton"]').should('contain.text', 'Show CRISS headers')
      cy.get('textarea#notes').should('have.value', '')
      cy.get('label[for="fileUpload"]').should('contain.text', 'Upload a file (optional)')
    })

    it('adds CRISS headers when textarea is empty', () => {
      loadPage()
      addNotePage.getCrissButton().click()

      addNotePage
        .getNotesTextarea()
        .should('have.value', 'Check in\n\nReview\n\nIntervention\n\nSummarise\n\nSet tasks')
    })

    it('does not overwrite existing notes with CRISS headers', () => {
      loadPage()
      addNotePage.getNotesTextarea().type('Some notes')
      addNotePage.getCrissButton().click()
      addNotePage.getNotesTextarea().should('have.value', 'Some notes')
    })

    checkValidation(loadPage, true)

    it('rejects files larger than 5mb', () => {
      loadPage()
      addNotePage.getFileUploadInput().attachFile(createFakeFile(6, 'pdf'))
      addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
      addNotePage.getSubmitBtn().click()

      addNotePage.checkErrorSummaryBox(['File size must be 5mb or under'])
    })
    ;(['pdf', 'doc', 'docx'] as const).forEach(filetype => {
      it(`uploads a valid ${filetype} file`, () => {
        cy.task('stubPatchDocument200Response')
        cy.intercept('POST', '/case/*/appointments/appointment/*/add-note').as('submit')

        loadPage()
        addNotePage.getFileUploadInput().attachFile(createFakeFile(1, filetype))
        addNotePage.getNotesTextarea().type('Test note')
        addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
        addNotePage.getSubmitBtn().click()

        cy.wait('@submit')
        cy.url().should('include', '/manage')
      })
    })

    it('submits successfully with sensitivity selected', () => {
      loadPage()
      addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
      addNotePage.getSubmitBtn().click()

      manageAppointmentPage = new ManageAppointmentPage()
    })
  })

  /* ------------------------------------------------------------------ */
  /* Past appointment journey                                            */
  /* ------------------------------------------------------------------ */

  describe('Arrange an appointment in the past', () => {
    const loadPage = (): void => {
      completeSentencePage()
      completeTypePage()
      completeLocationDateTimePage({ dateInPast: true })
      completeAttendedCompliedPage()
      addNotePage = new AddNotePage()
    }

    it('does not show file upload', () => {
      loadPage()
      cy.get('[data-qa="fileUpload"]').should('not.exist')
    })

    checkValidation(loadPage)

    it('redirects to check your answers page', () => {
      loadPage()
      addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
      addNotePage.getSubmitBtn().click()

      const cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.checkOnPage()
    })
  })
})
