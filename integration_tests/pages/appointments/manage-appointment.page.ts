import { DateTime } from 'luxon'
import Page from '../page'

export default class ManageAppointmentPage extends Page {
  getAlertBanner = () => {
    return cy.get('[data-qa="appointmentAlert"]')
  }

  getAppointmentActions = () => {
    return cy.get(`[data-qa="appointmentActions"]`)
  }

  getAppointmentDetails = () => {
    return cy.get(`[data-qa="appointmentDetails"]`)
  }

  getTaskName = (rowIndex: number) => {
    return cy.get(
      `[data-qa="appointmentActions"] li:nth-child(${rowIndex}) .govuk-task-list__name-and-hint div:nth-child(1)`,
    )
  }

  getTaskLink = (rowIndex: number) => {
    return cy.get(
      `[data-qa="appointmentActions"] li:nth-child(${rowIndex}) .govuk-task-list__name-and-hint .govuk-task-list__link`,
    )
  }

  getTaskHint = (rowIndex: number) => {
    return cy.get(
      `[data-qa="appointmentActions"] li:nth-child(${rowIndex}) .govuk-task-list__name-and-hint .govuk-task-list__hint`,
    )
  }

  getTaskStatus = (rowIndex: number) => {
    return cy.get(`[data-qa="appointmentActions"] li:nth-child(${rowIndex}) .govuk-task-list__status`)
  }

  getAppointmentDetailsListItem = (rowIndex: number, type: string) => {
    return cy.get(
      `[data-qa="appointmentDetails"] .govuk-summary-list .govuk-summary-list__row:nth-child(${rowIndex}) .govuk-summary-list__${type}`,
    )
  }
}
