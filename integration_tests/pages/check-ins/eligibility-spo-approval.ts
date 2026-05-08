import Page, { PageElement } from '../page'

export default class EligibilitySPOApprovalPage extends Page {
  constructor() {
    super("Check you've got approval before you sign")
  }

  getSubmitBtn = (): PageElement => cy.get('[data-qa="submit-btn"]')

  getCheckbox = (): PageElement => cy.get('input[value="spo-approval"]')
}
