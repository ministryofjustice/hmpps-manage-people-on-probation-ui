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

  verifyQuestionInList(expectedText: string) {
    cy.get('.govuk-table').should('contain.text', expectedText)
  }

  verifyQuestionNotInList(expectedText: string) {
    cy.get('.govuk-table').should('not.contain.text', expectedText)
  }

  clickEditForQuestion(index: number) {
    cy.get('[data-qa="edit-question-link"]').eq(index).click()
  }

  clickDeleteForQuestion(index: number) {
    cy.get('[data-qa="delete-question-link"]').eq(index).click()
  }

  verifyAddQuestionButtonHidden() {
    cy.get('[data-qa="add-question-btn"]').should('not.exist')
  }
}
