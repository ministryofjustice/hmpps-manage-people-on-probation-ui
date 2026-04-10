import { DateTime } from 'luxon'
import Page from '../page'

export default class AppointmentLocationDateTimePage extends Page {
  constructor() {
    super('Appointment date, time and location')
  }

  getSummaryLink = () => {
    return cy.get('.govuk-details__summary span')
  }

  getPersonalCircumstance = (name: string) => {
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

  getNextDayButton = (change?: DateTime) => {
    const now = change || DateTime.now().setZone('Europe/London')
    const future = DateTime.now().setZone('Europe/London').plus({ days: 2 })
    const futureIsInCurrentMonth = future.month === now.month
    if (!futureIsInCurrentMonth) {
      cy.get('.moj-js-datepicker-next-month').click()
    }
    return cy.get(`[data-testid="${future.toFormat('d/M/yyyy')}"]`)
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
