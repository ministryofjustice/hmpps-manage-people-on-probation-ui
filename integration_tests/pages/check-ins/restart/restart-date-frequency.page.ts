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
