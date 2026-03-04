import Page, { PageElement } from '../page'

export default class EligibilityCheckPage extends Page {
  constructor() {
    super('Check if')
  }

  getOptionOne = (): PageElement => cy.get('input[value="eligibility-1"]')

  getOptionTwo = (): PageElement => cy.get('input[value="eligibility-2"]')

  getOptionNine = (): PageElement => cy.get('input[value="eligibility-9"]')

  getNoneOption = (): PageElement => cy.get('input[value="eligibility-none"]')

  getSubmitBtn = (): PageElement => cy.get('[data-qa="submit-btn"]')
}
