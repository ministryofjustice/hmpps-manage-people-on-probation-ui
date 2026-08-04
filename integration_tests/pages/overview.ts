import Page from './page'

export default class OverviewPage extends Page {
  constructor() {
    super('Overview')
  }

  getAppointmentsLink = (crn: string, actionType = 'outcome') =>
    cy.get('.govuk-notification-banner__content').find(`a[href="/case/${crn}/record-an-outcome/${actionType}"]`)

  notificationBanner = () => cy.get('.govuk-notification-banner')

  notificationBannerContent = () => cy.get('.govuk-notification-banner__content')

  notificationHeading = () => cy.get('.govuk-notification-banner__content h2')

  notificationItems = () => cy.get('.govuk-notification-banner__content li')

  tierChangePromptItem = () => cy.get('[data-qa="tierChangePromptItem"]')

  tierChangePromptLink = () => cy.get('[data-qa="tierChangePromptLink"]')

  outcomesPromptItem = () => cy.get('[data-qa="outcomesPromptItem"]')
}
