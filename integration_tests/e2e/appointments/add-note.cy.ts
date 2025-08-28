import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import AddNotePage from '../../pages/appointments/add-note.page'

describe('Manage appointment - add a note', () => {
  let manageAppointmentPage: ManageAppointmentPage
  let addNotePage: AddNotePage

  const loadPage = () => {
    cy.visit('/case/X000001/appointments/appointment/6/manage')
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getTaskLink(2).click()
    addNotePage = new AddNotePage()
  }

  beforeEach(() => {
    loadPage()
  })
  it('should render the page', () => {
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
    cy.get('[data-qa="crissButton"]').click()
    cy.get('textarea#notes').should('have.value', 'Check in\n\nReview\n\nIntervention\n\nSummarise\n\nSet tasks')
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
    cy.pause()
  })
  it('should render the page with no notes', () => {})
})
