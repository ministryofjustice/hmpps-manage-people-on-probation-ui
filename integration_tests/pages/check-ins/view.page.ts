import Page from '../page'

export default class ViewCheckInPage extends Page {
  constructor() {
    super('Online check in submitted and reviewed')
  }

  radioSensitiveYes = () => cy.get('input[value="true"]')

  radioSensitiveNo = () => cy.get('input[value="false"]')

  sensitiveContactGroup = () => cy.get('[data-qa="sensitiveContact"]')

  hiddenSensitiveInput = () => cy.get('input[type="hidden"][name*="[sensitiveContact]"]')

  checkinNotes = () => cy.get('[data-qa="notes"]')

  completeReviewButton = () => cy.get('[data-qa="submit-btn"]')
}
