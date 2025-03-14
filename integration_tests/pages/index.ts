import Page, { PageElement } from './page'

export default class IndexPage extends Page {
  constructor() {
    super('Manage people on probation')
  }

  headerUserName = (): PageElement => cy.get('[data-qa=header-user-name]')

  headerPhaseBanner = (): PageElement => cy.get('[data-qa=header-phase-banner]')

  getAppointments = (): PageElement => cy.get('[data-qa=homepage-appointments]')

  getAppointmentRows = (): PageElement => cy.get('[data-qa=homepage-appointments] tbody tr')

  getOutcomesToLog = (): PageElement => cy.get('[data-qa=homepage-outcomes]')

  getOutcomesToLogRows = (): PageElement => cy.get('[data-qa=homepage-outcomes] tbody tr')

  getOtherServices = (): PageElement => cy.get('[data-qa=homepage-services-section]')

  getSearchSubmit = (): PageElement => cy.get('[data-qa=search-submit]')
}
