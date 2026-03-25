import Page from '../../../page'

export default class PreviewFeelingPage extends Page {
  constructor() {
    super('How have you been feeling since we last spoke?')
  }

  verifyQuestionPreviewHint() {
    cy.get('.govuk-hint').contains('Question preview').should('be.visible')
  }

  clickBackToQuestions() {
    cy.get('[data-qa="submit-btn"]').click()
  }
}
