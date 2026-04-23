import Page from '../../page'

export default class ListQuestionsPage extends Page {
  constructor() {
    super('Choose a question to add')
  }

  clickAddTemplateByIndex(index: number) {
    cy.get('[data-qa="add-question-link"]').eq(index).click()
  }
}
