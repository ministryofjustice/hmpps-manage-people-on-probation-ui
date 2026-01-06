import Page, { PageElement } from '../page'

export default class StopCheckins extends Page {
  getHeader = (): PageElement => cy.get('legend.govuk-fieldset__legend')
}
