import Page from './page'

export default class OverviewPage extends Page {
  constructor() {
    super('Overview')
  }

  getAppointmentsLink = (crn: string) =>
    cy.get('.govuk-notification-banner__content').find(`a[href="/case/${crn}/appointments"]`)
}
