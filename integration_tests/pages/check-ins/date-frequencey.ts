import { DateTime } from 'luxon'
import Page from '../page'

export default class DateFrequencyPage extends Page {
  constructor() {
    super('Set up online check ins')
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
