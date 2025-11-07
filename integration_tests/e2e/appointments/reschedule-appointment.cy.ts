import 'cypress-file-upload'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import config from '../../../server/config'
import RescheduleAppointmentPage from '../../pages/appointments/reschedule-appointment.page'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'

describe('Reschedule Appointment', () => {
  let manageAppointmentPage: ManageAppointmentPage
  let rescheduleAppointmentPage: RescheduleAppointmentPage
  let checkYourAnswerPage: RescheduleCheckYourAnswerPage

  const loadPage = () => {
    cy.visit('/case/X000001/appointments/appointment/6/manage')
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage
      .getAppointmentDetailsListItem(1, 'actions')
      .find('a')
      .should('contain.text', 'Reschedule')
      .should('have.attr', 'href', `/case/X000001/appointment/6/reschedule`)
      .click()
    rescheduleAppointmentPage = new RescheduleAppointmentPage()
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
      rescheduleAppointmentPage.getChooseFilesButton().click()
      const [fakeFile, fileName] = createFakeFile(1, filetype)
      cy.get('.moj-multi-file-upload__input').attachFile(fakeFile)
      rescheduleAppointmentPage.getFileUploadingItem(0, 'text').should('contain.text', fileName)
      rescheduleAppointmentPage.getFileUploadingItem(0, 'status').should('contain.text', 'Uploading')
      cy.wait('@fileUpload')
      rescheduleAppointmentPage.getFileUploadListItem('success', 'text', 0).should('contain.text', fileName)
      rescheduleAppointmentPage.getFileUploadListItem('success', 'status', 0).should('contain.text', 'Uploaded')
      rescheduleAppointmentPage.getFileUploadListItemDeleteButton(0).should('contain.text', 'Delete')
    })
  }

  afterEach(() => {
    cy.task('resetMocks')
  })

  it('should render the page', () => {
    loadPage()
    cy.get('.govuk-back-link').should('not.exist')
    cy.get('[data-qa=pageHeading]').should('contain.text', 'Reschedule an appointment')
    cy.get('div[data-qa="whoNeedsToReschedule"] legend').should(
      'contain.text',
      'Who needs to reschedule this appointment',
    )
    cy.get('.govuk-form-group .govuk-hint')
      .eq(0)
      .should('include.text', 'Planned Office Visit (NS) with Terry Jones on 21 February 2024 at 10:15am to 10:30am')

    cy.get('.govuk-form-group .govuk-hint')
      .eq(1)
      .should('contain.text', 'They should give 48 hours notice and provide evidence.')

    cy.get('.govuk-form-group .govuk-hint')
      .eq(2)
      .should('contain.text', 'Includes changes to probation practitioner availability.')
    rescheduleAppointmentPage.getWhoNeedsToReschedule().find('.govuk-radios__item').should('have.length', 2)
    const optionsWho = ['Eula', 'Probation Service']
    for (let i = 0; i < optionsWho.length; i += 1) {
      rescheduleAppointmentPage
        .getWhoNeedsToReschedule()
        .find('.govuk-radios__item')
        .eq(i)
        .find('label')
        .should('contain.text', optionsWho[i])
      rescheduleAppointmentPage
        .getWhoNeedsToReschedule()
        .find('.govuk-radios__item')
        .eq(i)
        .find('.govuk-radios__input')
        .should('not.be.checked')
    }
    cy.get('[data-qa=reason]').should('have.value', '')
    cy.get('.govuk-character-count label').should('contain.text', 'Why is this appointment being rescheduled?')
    cy.get('.govuk-character-count__status').should('contain.text', 'You have 4,000 characters remaining')
    rescheduleAppointmentPage.getFilesAdded().get('h2').should('contain.text', 'Files added')
    cy.get('label[for="file-upload-1"]').should('contain.text', 'Upload any supporting documents')
    cy.get('.moj-multi-file-upload__dropzone').should('contain.text', 'Drag and drop files here or')
    cy.contains('#file-upload-1-hint', 'For example, a sick note.').should('exist')
    cy.get('.moj-multi-file-upload__dropzone label').should('contain.text', 'Choose files')
    cy.get('div[data-qa="sensitiveInformation"] legend').should(
      'contain.text',
      'Does this contact include sensitive information?',
    )
    cy.get('.govuk-form-group .govuk-hint').should(
      'contain.text',
      'This is information that you believe must be recorded but not shared with a person on probation. If they make a request for their record, the Data Protection Team will decide whether the information can be shared.',
    )
    rescheduleAppointmentPage.getSensitiveInformation().find('.govuk-radios__item').should('have.length', 2)
    const options = ['Yes, it includes sensitive information', 'No, it is not sensitive']
    for (let i = 0; i < options.length; i += 1) {
      rescheduleAppointmentPage
        .getSensitiveInformation()
        .find('.govuk-radios__item')
        .eq(i)
        .find('label')
        .should('contain.text', options[i])
      rescheduleAppointmentPage
        .getSensitiveInformation()
        .find('.govuk-radios__item')
        .eq(i)
        .find('.govuk-radios__input')
        .should('not.be.checked')
    }

    rescheduleAppointmentPage.getSubmitBtn().should('contain.text', 'Continue')
    cy.get('.govuk-link').should('contain.text', 'Cancel and go back')
  })

  it('should display validation errors if continue button is clicked without first selecting a sensitive option', () => {
    loadPage()
    const reason = 'x'.repeat(4000)
    cy.get('[data-qa=reason]').type(reason, { delay: 0 })
    rescheduleAppointmentPage.getSubmitBtn().click()
    rescheduleAppointmentPage.checkErrorSummaryBox([
      'Select if appointment includes sensitive information',
      'Select who is rescheduling this appointment',
    ])
    rescheduleAppointmentPage
      .getElement(`.govuk-error-message`)
      .should('contain.text', 'Select if appointment includes sensitive information')
    rescheduleAppointmentPage.getErrorSummaryLink(0).click()
    // rescheduleAppointmentPage.getElement(`[data-qa=sensitiveInformation]`).should('be.focused')
  })

  it('should display validation errors if note is more than 4000 character', () => {
    loadPage()
    const note = 'x'.repeat(4001)
    cy.get('[data-qa=reason]').type(note, { delay: 0 })
    rescheduleAppointmentPage
      .getSensitiveInformation()
      .find('.govuk-radios__item')
      .eq(0)
      .find('.govuk-radios__input')
      .click()
    rescheduleAppointmentPage.getSubmitBtn().click()
    rescheduleAppointmentPage.checkErrorSummaryBox([
      'Reason must be 4000 characters or less',
      'Select who is rescheduling this appointment',
    ])
    rescheduleAppointmentPage
      .getElement(`.govuk-error-message`)
      .should('contain.text', 'Reason must be 4000 characters or less')
    cy.get('.govuk-character-count__status').should('contain.text', 'You have 1 character too many')
  })

  it('should count a return as 1 character', () => {
    loadPage()
    const paragraph = 'x'.repeat(2000)
    cy.get('[data-qa=reason]').type(`${paragraph}{enter}{enter}${paragraph}`, { delay: 0 })
    rescheduleAppointmentPage
      .getSensitiveInformation()
      .find('.govuk-radios__item')
      .eq(0)
      .find('.govuk-radios__input')
      .click()
    rescheduleAppointmentPage.getSubmitBtn().click()
    rescheduleAppointmentPage.checkErrorSummaryBox(['Select who is rescheduling this appointment'])
    rescheduleAppointmentPage
      .getElement(`.govuk-error-message`)
      .should('contain.text', 'Select who is rescheduling this appointment')
    cy.get('.govuk-character-count__status').should('contain.text', 'You have 1,998 characters remaining')
  })

  it('should validate a png file as being an invalid file type when selected', () => {
    loadPage()
    rescheduleAppointmentPage.getChooseFilesButton().click()
    const [fakeFile, fileName] = createFakeFile(1, 'png')
    cy.get('.moj-multi-file-upload__input').attachFile(fakeFile)
    rescheduleAppointmentPage
      .getFileUploadListItem('error', 'text', 0)
      .should('contain.text', `${fileName}: File type must be pdf or word`)
    rescheduleAppointmentPage.getFileUploadListItem('error', 'status', 0).should('contain.text', 'Upload failed')
    rescheduleAppointmentPage.getFileUploadListItemDeleteButton(0).should('contain.text', 'Delete')
  })

  it('should validate a file over 5mb in size as invalid', () => {
    loadPage()
    const [fakeFile, fileName] = createFakeFile(6, 'pdf')
    rescheduleAppointmentPage.getChooseFilesButton().click()
    cy.get('.moj-multi-file-upload__input').attachFile(fakeFile)
    rescheduleAppointmentPage
      .getFileUploadListItem('error', 'text', 0)
      .should('contain.text', `${fileName}: File size must be 5mb or under`)
    rescheduleAppointmentPage.getFileUploadListItem('error', 'status', 0).should('contain.text', 'Upload failed')
  })

  for (const filetype of ['pdf', 'doc', 'docx']) {
    checkUploadFile(filetype)
  }

  it('should persist the files added list when page is submitted', () => {
    cy.intercept('POST', '/appointments/file/upload').as('fileUpload')
    loadPage()
    const [fakeFile1, fileName1] = createFakeFile(1, 'png')
    const [fakeFile2, fileName2] = createFakeFile(1, 'pdf')
    rescheduleAppointmentPage.getChooseFilesButton().click()
    cy.get('.moj-multi-file-upload__input').attachFile(fakeFile1)
    cy.get('.moj-multi-file-upload__input').attachFile(fakeFile2)
    cy.wait('@fileUpload')
    rescheduleAppointmentPage.getSubmitBtn().click()
    rescheduleAppointmentPage
      .getFileUploadListItem('error', 'text', 0)
      .should('contain.text', `${fileName1}: File type must be pdf or word`)
    rescheduleAppointmentPage.getFileUploadListItem('error', 'status', 0).should('contain.text', 'Upload failed')
    rescheduleAppointmentPage.getFileUploadListItem('success', 'text', 1).should('contain.text', fileName2)
    rescheduleAppointmentPage.getFileUploadListItem('success', 'status', 1).should('contain.text', 'Uploaded')
  })

  it('should submit the page successfully if all mandatory option are filled/ selected then continue is clicked', () => {
    loadPage()
    rescheduleAppointmentPage
      .getWhoNeedsToReschedule()
      .find('.govuk-radios__item')
      .eq(0)
      .find('.govuk-radios__input')
      .click()
    rescheduleAppointmentPage
      .getSensitiveInformation()
      .find('.govuk-radios__item')
      .eq(0)
      .find('.govuk-radios__input')
      .click()
    rescheduleAppointmentPage.getReason().type(`abc`)
    rescheduleAppointmentPage.getSubmitBtn().click()
    checkYourAnswerPage = new RescheduleCheckYourAnswerPage()
  })

  it('should hide the file delete button when feature toggle is disabled', () => {
    const checkAddedFiles = (reload = false) => {
      const assertion = reload ? 'not.be.visible' : 'not.exist'
      rescheduleAppointmentPage.getFileUploadListItem('success', 'text', 0).should('contain.text', fileName)
      rescheduleAppointmentPage.getFileUploadListItem('success', 'status', 0).should('contain.text', 'Uploaded')
      rescheduleAppointmentPage.getFileUploadListItemDeleteButton(0).should('not.be.visible')
      rescheduleAppointmentPage
        .getFileUploadListItem('error', 'text', 1)
        .should('contain.text', `${fileName2}: File type must be pdf or word`)
      rescheduleAppointmentPage.getFileUploadListItem('error', 'status', 1).should('contain.text', 'Upload failed')
      rescheduleAppointmentPage.getFileUploadListItemDeleteButton(1).should(assertion)
      rescheduleAppointmentPage
        .getFileUploadListItem('error', 'text', 2)
        .should('contain.text', `${fileName3}: File size must be 5mb or under`)
      rescheduleAppointmentPage.getFileUploadListItem('error', 'status', 2).should('contain.text', 'Upload failed')
      rescheduleAppointmentPage.getFileUploadListItemDeleteButton(1).should(assertion)
    }
    cy.task('stubNoDeleteAppointmentFiles')
    cy.intercept('POST', '/appointments/file/upload').as('fileUpload')
    loadPage()
    const [fakeFile, fileName] = createFakeFile(1, 'pdf')
    const [fakeFile2, fileName2] = createFakeFile(1, 'png')
    const [fakeFile3, fileName3] = createFakeFile(6, 'pdf')
    rescheduleAppointmentPage.getChooseFilesButton().click()
    cy.get('.moj-multi-file-upload__input').attachFile([fakeFile, fakeFile2, fakeFile3])
    cy.wait('@fileUpload')
    checkAddedFiles()
    rescheduleAppointmentPage.getSubmitBtn().click()
    const reload = true
    checkAddedFiles(reload)
  })
})
