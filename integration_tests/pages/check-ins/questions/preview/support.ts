import Page from '../../../page'

export default class PreviewSupportPage extends Page {
  constructor() {
    super('Is there anything you need support with or want to let us know about?')
  }

  checkAllCheckboxesAreDisabled() {
    cy.get('.govuk-checkboxes__input').each($el => {
      cy.wrap($el).should('be.disabled')
    })
  }

  checkAllTextareasAreReadonly() {
    cy.get('.govuk-textarea').each($el => {
      cy.wrap($el).should('have.attr', 'readonly')
    })
  }

  clickBackToQuestions() {
    cy.get('[data-qa="submit-btn"]').click()
  }
}
