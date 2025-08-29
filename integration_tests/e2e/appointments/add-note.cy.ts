import 'cypress-file-upload'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import config from '../../../server/config'

describe('Manage appointment - add a note', () => {
  let manageAppointmentPage: ManageAppointmentPage
  let addNotePage: AddNotePage

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
      cy.intercept('POST', '/appointments/file/upload').as('fileUpload')
      loadPage()
      addNotePage.getChooseFilesButton().click()
      const [fakeFile, fileName] = createFakeFile(1, filetype)
      cy.get('.moj-multi-file-upload__input').attachFile(fakeFile)
      addNotePage.getFileUploadingItem(0, 'text').should('contain.text', fileName)
      addNotePage.getFileUploadingItem(0, 'status').should('contain.text', 'Uploading')
      cy.wait('@fileUpload')
      addNotePage.getFileUploadListItem('success', 'text', 0).should('contain.text', fileName)
      addNotePage.getFileUploadListItem('success', 'status', 0).should('contain.text', 'Uploaded')
      addNotePage.getFileUploadListItemDeleteButton(0).should('contain.text', 'Delete')
    })
  }

  beforeEach(() => {
    cy.task('resetMocks')
  })

  it('should render the page', () => {
    loadPage()
    cy.get('p.govuk-body')
      .eq(0)
      .should(
        'contain.text',
        'Use paragraphs and formatting to make your notes easy to read. You may want to record notes in the CRISS format.',
      )
    cy.get('.govuk-details__summary-text').should('contain.text', 'Take notes using CRISS').click()
    cy.get('.govuk-details__text').should('contain.text', 'some html')
    addNotePage.getPreviousNotes().find('h3').should('contain.text', 'Previous notes')
    addNotePage.getPreviousNotes().find('.app-note').should('have.length', 1)
    addNotePage.getPreviousNotes().find('.app-note p').eq(0).should('contain.text', 'Some notes')
    addNotePage.getPreviousNotes().find('.app-note p').eq(1).should('contain.text', 'Comment added by not entered')
    cy.get('[data-qa="crissButton"]').should('contain.text', 'Show CRISS headers')
    cy.get('textarea#notes').should('have.value', '')
    addNotePage.getFilesAdded().get('h2').should('contain.text', 'Files added')
    cy.get('label[for="file-upload-1"]').should('contain.text', 'Upload files')
    cy.get('.moj-multi-file-upload__dropzone').should('contain.text', 'Drag and drop files here or')
    cy.get('.moj-multi-file-upload__dropzone label').should('contain.text', 'Choose files')
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
    addNotePage.getSubmitBtn().click()
    addNotePage.checkErrorSummaryBox(['Select whether or not the appointment note contains sensitive information'])
    addNotePage.getElement(`#sensitive-error`).should('contain.text', 'Please select an option')
    addNotePage.getErrorSummaryLink(0).click()
    addNotePage.getElement(`#sensitive`).should('be.focused')
  })

  it('should validate a png file as being an invalid file type when selected', () => {
    loadPage()
    addNotePage.getChooseFilesButton().click()
    const [fakeFile, fileName] = createFakeFile(1, 'png')
    cy.get('.moj-multi-file-upload__input').attachFile(fakeFile)
    addNotePage
      .getFileUploadListItem('error', 'text', 0)
      .should('contain.text', `${fileName}: file type must be pdf or word`)
    addNotePage.getFileUploadListItem('error', 'status', 0).should('contain.text', 'Upload failed')
    addNotePage.getFileUploadListItemDeleteButton(0).should('contain.text', 'Delete')
  })

  it('should validate a file over 5mb in size as invalid', () => {
    loadPage()
    const [fakeFile, fileName] = createFakeFile(6, 'pdf')
    addNotePage.getChooseFilesButton().click()
    cy.get('.moj-multi-file-upload__input').attachFile(fakeFile)
    addNotePage
      .getFileUploadListItem('error', 'text', 0)
      .should('contain.text', `${fileName}: File size must be 5mb or under`)
    addNotePage.getFileUploadListItem('error', 'status', 0).should('contain.text', 'Upload failed')
  })

  for (const filetype of ['pdf', 'doc', 'docx']) {
    checkUploadFile(filetype)
  }

  it('should persist the files added list when page is submitted', () => {
    cy.intercept('POST', '/appointments/file/upload').as('fileUpload')
    loadPage()
    const [fakeFile1, fileName1] = createFakeFile(1, 'png')
    const [fakeFile2, fileName2] = createFakeFile(1, 'pdf')
    addNotePage.getChooseFilesButton().click()
    cy.get('.moj-multi-file-upload__input').attachFile(fakeFile1)
    cy.wait('@fileUpload')
    cy.get('.moj-multi-file-upload__input').attachFile(fakeFile2)
    cy.wait('@fileUpload')
    addNotePage.getSubmitBtn().click()
    addNotePage
      .getFileUploadListItem('error', 'text', 0)
      .should('contain.text', `${fileName1}: file type must be pdf or word`)
    addNotePage.getFileUploadListItem('error', 'status', 0).should('contain.text', 'Upload failed')
    addNotePage.getFileUploadListItem('success', 'text', 1).should('contain.text', fileName2)
    addNotePage.getFileUploadListItem('success', 'status', 1).should('contain.text', 'Uploaded')
  })

  it('should submit the page successfully if sensitivity option is selected then continue is clicked', () => {
    loadPage()
    addNotePage.getSensitiveInformation().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    addNotePage.getSubmitBtn().click()
    manageAppointmentPage = new ManageAppointmentPage()
  })

  it('should hide the file delete button when feature toggle is disabled', () => {
    const checkAddedFiles = (reload = false) => {
      const assertion = reload ? 'not.be.visible' : 'not.exist'
      addNotePage.getFileUploadListItem('success', 'text', 0).should('contain.text', fileName)
      addNotePage.getFileUploadListItem('success', 'status', 0).should('contain.text', 'Uploaded')
      addNotePage.getFileUploadListItemDeleteButton(0).should(assertion)
      addNotePage
        .getFileUploadListItem('error', 'text', 1)
        .should('contain.text', `${fileName2}: file type must be pdf or word`)
      addNotePage.getFileUploadListItem('error', 'status', 1).should('contain.text', 'Upload failed')
      addNotePage.getFileUploadListItemDeleteButton(1).should(assertion)
      addNotePage
        .getFileUploadListItem('error', 'text', 2)
        .should('contain.text', `${fileName3}: File size must be 5mb or under`)
      addNotePage.getFileUploadListItem('error', 'status', 2).should('contain.text', 'Upload failed')
      addNotePage.getFileUploadListItemDeleteButton(1).should(assertion)
    }
    cy.task('stubNoDeleteAppointmentFiles')
    cy.intercept('POST', '/appointments/file/upload').as('fileUpload')
    loadPage()
    const [fakeFile, fileName] = createFakeFile(1, 'pdf')
    const [fakeFile2, fileName2] = createFakeFile(1, 'png')
    const [fakeFile3, fileName3] = createFakeFile(6, 'pdf')
    addNotePage.getChooseFilesButton().click()
    cy.get('.moj-multi-file-upload__input').attachFile([fakeFile, fakeFile2, fakeFile3])
    cy.wait('@fileUpload')
    checkAddedFiles()
    addNotePage.getSubmitBtn().click()
    const reload = true
    checkAddedFiles(reload)
  })
})
