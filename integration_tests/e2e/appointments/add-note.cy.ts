import 'cypress-file-upload'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import config from '../../../server/config'

describe('Manage appointment - add a note', () => {
  let manageAppointmentPage: ManageAppointmentPage
  let addNotePage: AddNotePage

  afterEach(() => {
    cy.task('resetMocks')
  })

  const loadPage = () => {
    cy.visit('/case/X000001/appointments/appointment/6/manage')
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getTaskLink(2).click()
    addNotePage = new AddNotePage()
  }

  const createFakeFile = (mb: number, type: string): [Cypress.FixtureData, string] => {
    const fileSize = mb * 1024 * 1024
    const fileContent = new Blob(['a'.repeat(fileSize)], { type: 'text/plain' })
    const fileName = `fake${mb}mb.${type}`
    const mimeType = Object.keys(config.validMimeTypes).includes(type)
      ? config.validMimeTypes[type]
      : `application/${type}`
    const fakeFile: Cypress.FixtureData = {
      fileContent,
      fileName,
      mimeType,
    }
    return [fakeFile, fileName]
  }

  const checkUploadFile = (filetype: string): void => {
    it(`should upload a selected ${filetype} file`, () => {
      // Intercept the form submission, not a separate file upload endpoint
      cy.intercept('POST', '/case/*/appointments/appointment/*/add-note').as('formSubmit')
      loadPage()

      const [fakeFile, fileName] = createFakeFile(1, filetype)

      // Upload using the file input
      addNotePage.getFileUploadInput().attachFile(fakeFile)

      // Add a note (optional but good practice)
      cy.get('#notes').type('Test note')

      // Select sensitivity option
      addNotePage.getSensitiveInformation().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()

      // Submit form
      addNotePage.getSubmitBtn().click()

      // Wait for form submission
      cy.wait('@formSubmit')

      // Verify navigation to manage page (successful upload)
      cy.url().should('include', '/manage')
    })
  }

  it('should render the page', () => {
    loadPage()
    cy.get('.govuk-back-link').should('not.exist')
    cy.get('p.govuk-body')
      .eq(0)
      .should(
        'contain.text',
        'Use paragraphs and formatting to make your notes easy to read. You may want to record notes in the CRISS format.',
      )
    cy.get('.govuk-details__summary-text').should('contain.text', 'Take notes using CRISS').click()
    cy.get('.govuk-details__text').should(
      'contain.html',
      '<p class="govuk-body govuk-!-margin-bottom-1">CRISS stands for:</p><ul class="govuk-list govuk-list--bullet"><li>Check in with the person on probation</li><li>Review their progress from the last session</li><li>Intervention - target their criminogenic needs and risk</li><li>Summarise what you discussed in this session</li><li>Set tasks to review in the next session</li></ul>',
    )

    addNotePage.getPreviousNotes().find('h3').should('contain.text', 'Previous notes')
    addNotePage.getPreviousNotes().find('.app-note').should('have.length', 1)
    addNotePage.getPreviousNotes().find('.app-note p').eq(0).should('contain.text', 'Some notes')
    addNotePage.getPreviousNotes().find('.app-note p').eq(1).should('contain.text', 'Comment added by not entered')

    cy.get('[data-qa="crissButton"]').should('contain.text', 'Show CRISS headers')
    cy.get('textarea#notes').should('have.value', '')

    // File upload assertions
    cy.get('label[for="fileUpload"]').should('contain.text', 'Upload a file (optional)')
    cy.get('#fileUpload').should('exist')
    cy.get('#fileUpload-input').should('exist')
    cy.get('#fileUpload-input').should(
      'have.attr',
      'accept',
      'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )

    cy.get('div[data-qa="sensitiveInformation"] legend').should(
      'contain.text',
      'Does this appointment include sensitive information?',
    )
    cy.get('#sensitive-hint').should(
      'contain.text',
      'This is information that you believe must be recorded but not shared with a person on probation. If they make a request for their record, the Data Protection Team will decide whether the information can be shared.',
    )
    addNotePage.getSensitiveInformation().find('.govuk-radios__item').should('have.length', 2)
    const options = ['Yes, it includes sensitive information', 'No, it is not sensitive']
    for (let i = 0; i < options.length; i += 1) {
      addNotePage
        .getSensitiveInformation()
        .find('.govuk-radios__item')
        .eq(i)
        .find('label')
        .should('contain.text', options[i])
      addNotePage
        .getSensitiveInformation()
        .find('.govuk-radios__item')
        .eq(i)
        .find('.govuk-radios__input')
        .should('not.be.checked')
    }

    addNotePage.getSubmitBtn().should('contain.text', 'Continue')
  })

  it('should render the page with no previous notes', () => {
    cy.task('stubPastAppointmentNoOutcomeNoNotes')
    loadPage()
    addNotePage.getPreviousNotes().should('not.exist')
  })

  it('should add the CRISS headers to the textarea', () => {
    loadPage()
    addNotePage.getCrissButton().click()
    addNotePage.getNotesTextarea().should('have.value', 'Check in\n\nReview\n\nIntervention\n\nSummarise\n\nSet tasks')
  })

  it('should not add CRISS headers if notes textarea contains a value', () => {
    loadPage()
    const notesValue = 'Some notes'
    addNotePage.getNotesTextarea().type(notesValue)
    addNotePage.getCrissButton().click()
    addNotePage.getNotesTextarea().should('have.value', notesValue)
  })

  it('should display validation errors if continue button is clicked without first selecting a sensitive option', () => {
    loadPage()
    const note = 'x'.repeat(4000)
    cy.get('#notes').type(note, { delay: 0 })
    addNotePage.getSubmitBtn().click()
    addNotePage.checkErrorSummaryBox(['Select whether or not the appointment note contains sensitive information'])
    addNotePage.getElement(`#sensitive-error`).should('contain.text', 'Please select an option')
    addNotePage.getErrorSummaryLink(0).click()
    addNotePage.getElement(`#sensitive`).should('be.focused')
  })

  it('should display validation errors if note is more than 4000 character', () => {
    loadPage()
    const note = 'x'.repeat(4001)
    cy.get('#notes').type(note, { delay: 0 })
    addNotePage.getSensitiveInformation().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    addNotePage.getSubmitBtn().click()
    addNotePage.checkErrorSummaryBox(['Note must be 4000 characters or less'])
    addNotePage.getElement(`#notes-error`).should('contain.text', 'Note must be 4000 characters or less')
    cy.get('.govuk-character-count__status').should('contain.text', 'You have 1 character too many')
  })

  it('should count a return as 1 character', () => {
    loadPage()
    const paragraph = 'x'.repeat(2000)
    cy.get('#notes').type(`${paragraph}{enter}{enter}${paragraph}`, { delay: 0 })
    addNotePage.getSensitiveInformation().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    addNotePage.getSubmitBtn().click()
    addNotePage.checkErrorSummaryBox(['Note must be 4000 characters or less'])
    addNotePage.getElement(`#notes-error`).should('contain.text', 'Note must be 4000 characters or less')
    cy.get('.govuk-character-count__status').should('contain.text', 'You have 2 characters too many')
  })

  it('should display validation error for file over 5mb when continue is clicked', () => {
    loadPage()
    const [fakeFile, fileName] = createFakeFile(6, 'pdf')

    // Upload oversized file
    addNotePage.getFileUploadInput().attachFile(fakeFile)

    // Select sensitivity option
    addNotePage.getSensitiveInformation().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()

    // Click continue to trigger validation
    addNotePage.getSubmitBtn().click()

    // Check for validation error in error summary
    addNotePage.checkErrorSummaryBox(['File size must be 5mb or under'])

    // Verify error summary link
    cy.get('.govuk-error-summary__list a').should('contain.text', 'File size must be 5mb or under')
    cy.get('.govuk-error-summary__list a').should('have.attr', 'href', '#file-upload-1')
  })

  for (const filetype of ['pdf', 'doc', 'docx']) {
    checkUploadFile(filetype)
  }

  it('should submit the page successfully if sensitivity option is selected then continue is clicked', () => {
    loadPage()
    addNotePage.getSensitiveInformation().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    addNotePage.getSubmitBtn().click()
    manageAppointmentPage = new ManageAppointmentPage()
  })

  it('should submit successfully with a valid file and sensitivity option selected', () => {
    cy.intercept('POST', '/case/*/appointments/appointment/*/add-note').as('formSubmit')
    loadPage()

    const [fakeFile, fileName] = createFakeFile(1, 'pdf')

    // Upload valid file
    addNotePage.getFileUploadInput().attachFile(fakeFile)

    // Add note
    cy.get('#notes').type('Test note')

    // Select sensitivity option
    addNotePage.getSensitiveInformation().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()

    // Submit
    addNotePage.getSubmitBtn().click()

    // Wait for form submission
    cy.wait('@formSubmit')

    // Verify navigation
    cy.url().should('include', '/manage')
  })
})
