import Page from '../../page'

export default class InstructionsPage extends Page {
  constructor() {
    super('How to write questions for an online service')
  }

  clickContinue() {
    cy.get('[data-qa="submit-btn"]').click()
  }
}
