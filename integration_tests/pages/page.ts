export type PageElement = Cypress.Chainable<JQuery>

export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  constructor(private title?: string) {
    if (this.title) {
      this.checkOnPage()
    }
  }

  checkOnPage(): void {
    cy.get('[data-qa=pageHeading]').contains(this.title)
  }

  setPageTitle = (title: string) => {
    this.title = title
    this.checkOnPage()
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')

  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')

  headerCrn = (): PageElement => cy.get('[data-qa=crn]')

  headerName = (): PageElement => cy.get('[data-qa=name]')

  pageHeading = (): PageElement => cy.get('[data-qa=pageHeading]')

  getNavigationLink = (index: number): PageElement => cy.get(`.moj-primary-navigation__list li:nth-of-type(${index}) a`)

  getTab = (tabName: string): PageElement => cy.get(`[data-qa=${tabName}Tab]`)

  getCardHeader = (cardName: string): PageElement =>
    cy.get(`[class=app-summary-card__header]`).get(`[data-qa=${cardName}Card]`)

  getCardElement = (cardName: string, element: string, index: number): PageElement =>
    this.getCardHeader(cardName).within(() => cy.get(element).eq(index))

  getRowData = (cardName: string, rowName: string, type: string, index = 0): PageElement => {
    return cy.get(`[data-qa=${cardName}Card]`).within(() => cy.get(`[data-qa=${rowName}${type}]`).eq(index))
  }

  getElementData = (name: string): PageElement => {
    return cy.get(`[data-qa=${name}]`)
  }

  getRowDataIndex = (cardName: string, rowName: string, type: string, index: number): PageElement => {
    return cy
      .get(`[data-qa=${cardName}Card]`)
      .eq(index)
      .within(() => cy.get(`[data-qa=${rowName}${type}]`))
  }

  assertPageElementAtIndexWithin = (
    element: string,
    index: number,
    withinElement: string,
    withinIndex: number,
    value: string,
  ) => {
    cy.get(element)
      .eq(index)
      .within(() => cy.get(withinElement).eq(withinIndex).contains(value))
  }

  assertAnchorElementAtIndex = (element: string, index: number, value: string) => {
    cy.get(element)
      .eq(index)
      .within(() => cy.get('a').invoke('attr', 'href').should('equal', value))
  }

  assertTextElementAtIndex = (element: string, index: number, value: string) => {
    cy.get(element).eq(index).should('contain.text', value)
  }

  assertTextAtElementAtIndex = (element: string, index: number, value: string) => {
    cy.get(element)
      .eq(index)
      .within(() => cy.contains(value))
  }

  assertAnchorElementAtIndexWithin = (element: string, index: number, anchorIndex: number, value: string) => {
    cy.get(element)
      .eq(index)
      .within(() => cy.get('a').eq(anchorIndex).invoke('attr', 'href').should('equal', value))
  }

  createAliasAtIndexWithin = (
    element: string,
    index: number,
    withinElement: string,
    withinIndex: number,
    aliasName: string,
  ) => {
    cy.get(element)
      .eq(index)
      .within(() => cy.get(withinElement).eq(withinIndex).as(aliasName))
  }

  getBackLink = (): PageElement => cy.get('.govuk-back-link')

  getSubmitBtn = (): PageElement => cy.get('[data-qa="submit-btn"]')

  getRadio = (id: string, index: number): PageElement => {
    return cy.get(`[data-qa="${id}"] .govuk-radios__item:nth-child(${index}) input`)
  }

  getCheckboxField = (name: string): PageElement => {
    return cy.get(`input[type="checkbox"]`)
  }

  getRadioLabel = (id: string, index: number): PageElement => {
    return cy.get(`[data-qa="${id}"] .govuk-radios__item:nth-child(${index}) label`)
  }

  getRadios = (id: string) => {
    return cy.get(`[data-qa="${id}"] .govuk-radios__item input`)
  }

  getRadioLabels = (id: string) => {
    return cy.get(`[data-qa="${id}"].govuk-radios__item label`)
  }

  getErrorSummaryBox = (): PageElement => {
    return cy.get('.govuk-error-summary')
  }

  getAllErrorSummaryLinks = (): PageElement => {
    return cy.get('.govuk-error-summary__list a')
  }

  getErrorSummaryLink = (index: number): PageElement => {
    return cy.get('.govuk-error-summary__list li').eq(index).find('a')
  }

  getElement = (selector: string) => {
    return cy.get(selector)
  }

  getElementInput = (name: string): PageElement => {
    return cy.get(`[data-qa="${name}"] input`)
  }

  checkErrorSummaryBox = (summaryErrors: string[]): void => {
    this.getErrorSummaryBox().should('be.visible')
    this.getAllErrorSummaryLinks().should('have.length', summaryErrors.length)
    this.getAllErrorSummaryLinks().each(($item, index) => {
      expect($item.text()).to.eq(summaryErrors[index])
    })
  }

  getSummaryListRow = (index: number) => {
    return cy.get(`.govuk-summary-list__row:nth-child(${index})`)
  }

  assertRiskTags() {
    cy.get(`[class=predictor-timeline-item__level]`)
      .eq(0)
      .within(() => cy.get('strong').should('contain.text', 'ROSH'))

    cy.get(`[class=predictor-timeline-item__level]`)
      .eq(1)
      .within(() => cy.get('strong').should('contain.text', 'RSR'))
  }
}
