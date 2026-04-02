import Page from '../../page'

export default class EditQuestionPage extends Page {
  constructor() {
    super('What do you want to ask')
  }

  enterCustomQuestion(text: string) {
    cy.get('input[name*="[manageQuestions][customQuestion]"]').type(`{selectall}{backspace}${text}`)
  }

  clearCustomQuestion() {
    cy.get('input[name*="[manageQuestions][customQuestion]"]').clear()
  }

  clickContinue() {
    cy.get('button[data-qa="submit-btn"]').click()
  }

  checkValidationError(expectedMessage: string) {
    cy.get('.govuk-error-message').should('contain.text', expectedMessage)
  }
}
