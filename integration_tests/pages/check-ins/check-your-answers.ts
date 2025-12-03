import Page, { PageElement } from '../page'

export default class CheckYourAnswersPage extends Page {
  constructor() {
    super('Check your answers before adding Caroline to online check ins')
  }

  getBackLink = (): PageElement => cy.get('.govuk-back-link')

  getErrorText = (): PageElement => cy.get('#registration-error-content')

  getDateActionBtn = (): PageElement => cy.get('[data-qa="dateAction"]')

  getIntervalActionBtn = (): PageElement => cy.get('[data-qa="intervalAction"]')

  getPreferredComsActionBtn = (): PageElement => cy.get('[data-qa="preferredComsAction"]')

  getCheckInMobileActionBtn = (): PageElement => cy.get('[data-qa="checkInMobileAction"]')

  getCheckInEmailActionBtn = (): PageElement => cy.get('[data-qa="checkInEmailAction"]')

  getPhotoUploadOptionActionBtn = (): PageElement => cy.get('[data-qa="photoUploadOptionAction"]')

  getPhotoActionBtn = (): PageElement => cy.get('[data-qa="photoAction"]')
}
