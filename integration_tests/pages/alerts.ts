import Page, { PageElement } from './page'

export default class AlertsPage extends Page {
  constructor() {
    super('Alerts')
  }

  noAlertsMessage = (): PageElement => cy.get('p').contains('You do not have any alerts.')
}
