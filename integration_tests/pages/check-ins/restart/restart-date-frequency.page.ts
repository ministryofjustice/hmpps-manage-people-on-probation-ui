import { DateTime } from 'luxon'
import Page, { PageElement } from '../../page'

export default class RestartDateFrequencyPage extends Page {
  constructor() {
    super('Online check in settings')
  }

  getDatePickerToggle = () => {
    return cy.get('.moj-datepicker__toggle')
  }

  getNextDayButton = () => {
    const nextDay = DateTime.now().plus({ days: 1 }).toFormat('d/M/yyyy')
    return cy.get(`[data-testid="${nextDay}"]`)
  }

  getFrequency = () => {
    return cy.get(`[data-qa="checkInFrequency"]`)
  }
}
