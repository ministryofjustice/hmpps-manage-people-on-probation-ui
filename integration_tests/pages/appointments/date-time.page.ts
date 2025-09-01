import { DateTime } from 'luxon'
import Page from '../page'

export default class AppointmentDateTimePage extends Page {
  constructor() {
    super('Enter the date and time of the appointment')
  }

  getSummaryLink = () => {
    return cy.get('.govuk-details__summary span')
  }

  getElement = (name: string) => {
    return cy.get(`[data-qa="${name}"]`)
  }

  getDatePickerToggle = () => {
    return cy.get('.moj-datepicker__toggle')
  }

  getDatePickerDialog = () => {
    return cy.get('.moj-datepicker__dialog')
  }

  getActiveDayButton = () => {
    return cy.get('.moj-datepicker__button--current')
  }

  getNextDayButton = () => {
    const nextDay = DateTime.now().plus({ days: 1 }).toFormat('d/M/yyyy')
    return cy.get(`[data-testid="${nextDay}"]`)
  }

  getDatePickerInput = () => {
    return cy.get('.moj-js-datepicker-input')
  }

  getTimePickerList = () => {
    return cy.get('.ui-timepicker-list')
  }

  getTimePickerListItems = () => {
    return cy.get('.ui-timepicker-list li', { timeout: 3000 })
  }

  getWarning = (name: string) => {
    return cy.get(`[data-qa="${name}Warning"]`)
  }
}
