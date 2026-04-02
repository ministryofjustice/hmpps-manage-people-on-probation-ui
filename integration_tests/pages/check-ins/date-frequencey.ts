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
    const now = DateTime.now()
    const future = now.plus({ days: 2 })
    const futureIsInCurrentMonth = future.month === now.month
    if (!futureIsInCurrentMonth) {
      cy.get('.moj-js-datepicker-next-month').click()
    }
    return cy.get(`[data-testid="${future.toFormat('d/M/yyyy')}"]`)
  }

  getFrequency = () => {
    return cy.get(`[data-qa="checkInFrequency"]`)
  }
}
