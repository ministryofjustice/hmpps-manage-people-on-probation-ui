import Page from '../../page'

export default class EditQuestionPage extends Page {
  constructor() {
    super('What do you want to ask')
  }

  enterDraftQuestionInput(text: string) {
    cy.get('input[name*="[manageQuestions][draftQuestionInput]"]').type(`{selectall}{backspace}${text}`)
  }

  clickContinue() {
    cy.get('button[data-qa="submit-btn"]').click()
  }

  checkValidationError(expectedMessage: string) {
    cy.get('.govuk-error-message').should('contain.text', expectedMessage)
  }
}
