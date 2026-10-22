import Page, { PageElement } from '../page'

export default class EditContactDetails extends Page {
  constructor() {
    super('Edit contact details')
  }

  getNoFixedAddress = (): PageElement => {
    return cy.get(`#noFixedAddress`)
  }

  getElement = (name: string): PageElement => {
    return cy.get(`[data-qa="${name}"]`)
  }

  getDateElementInput = (name: string): PageElement => {
    return cy.get(`[data-qa="${name}"] govuk-input moj-js-datepicker-input`)
  }

  getAlert = (): PageElement => cy.get('[data-qa="updateBanner"]')
}
