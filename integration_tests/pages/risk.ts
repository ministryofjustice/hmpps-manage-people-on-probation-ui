import Page, { PageElement } from './page'

export default class RiskPage extends Page {
  constructor() {
    super('Risk')
  }

  getCriminogenicNeeds = (): PageElement => cy.get(`[data-qa=criminogenicNeeds]`)

  getInsetText = (): PageElement => cy.get(`.govuk-inset-text`)

  getRSR = (): PageElement => cy.get(`[data-qa=rsr]`)
}
