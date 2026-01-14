import Page, { PageElement } from '../page'

export default class ManageCheckins extends Page {
  constructor() {
    super('Online check ins')
  }

  getImage = (): PageElement => cy.get('[data-qa="photoCard"] img')
}
