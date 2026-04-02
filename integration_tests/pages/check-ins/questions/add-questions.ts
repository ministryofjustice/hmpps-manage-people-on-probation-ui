import Page from '../../page'

export default class AddQuestionsPage extends Page {
  constructor() {
    super('Add questions to')
  }

  clickPreviewFeeling() {
    cy.get('[data-qa="preview-feeling-link"]').click()
  }

  clickPreviewSupport() {
    cy.get('[data-qa="preview-support-link"]').click()
  }

  clickAddQuestion() {
    cy.get('[data-qa="add-question-btn"]').click()
  }

  clickSaveQuestions() {
    cy.get('[data-qa="save-questions-btn"]').click()
  }

  clickCancel() {
    cy.get('[data-qa="cancel-link"]').click()
  }
}
