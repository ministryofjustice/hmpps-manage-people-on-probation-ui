import Page from '../page'

export default class AddNotePage extends Page {
  constructor() {
    super('Add a note (optional)')
  }

  getSensitiveInformation = () => {
    return cy.get(`[data-qa="sensitiveInformation"]`)
  }

  getPreviousNotes = () => {
    return cy.get(`[data-qa="previousNotes"]`)
  }
}
