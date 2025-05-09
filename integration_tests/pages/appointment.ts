import Page, { PageElement } from './page'

export default class AppointmentPage extends Page {
  appointmentType = (): PageElement => cy.get('[data-qa=appointmentType]')

  appointmentTitle = (): PageElement => cy.get('[data-qa=appointmentTitle]')

  complianceTag = (): PageElement => cy.get('[data-qa=complianceTag]')
}
