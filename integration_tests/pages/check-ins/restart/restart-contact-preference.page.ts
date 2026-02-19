import Page, { PageElement } from '../../page'

export default class RestartContactPreferencePage extends Page {
  constructor() {
    super('Contact preferences')
  }

  getSubmitBtn = (): PageElement => cy.get('[data-qa="submitBtn"]')

  getMobileNumberChangeLink = (): PageElement => cy.get('[data-qa="mobileNumberAction"]')

  getEmailAddressChangeLink = (): PageElement => cy.get('[data-qa="emailAddressAction"]')

  getCheckInPreferredComs = () => {
    return cy.get(`[data-qa="checkInPreferredComs"]`)
  }
}
