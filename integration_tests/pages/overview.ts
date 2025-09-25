import Page from './page'

export default class OverviewPage extends Page {
  constructor() {
    super('Overview')
  }

  getAppointmentsLink = (crn: string, actionType = 'outcome') =>
    cy.get('.govuk-notification-banner__content').find(`a[href="/case/${crn}/record-an-outcome/${actionType}"]`)
}
