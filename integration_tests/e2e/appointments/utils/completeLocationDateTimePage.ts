import { DateTime } from 'luxon'
import AppointmentLocationDateTimePage from '../../../pages/appointments/location-date-time.page'
import { crn, uuid, startTime, endTime } from '../imports/common'

interface Props {
  index?: number
  crnOverride?: string
  uuidOveride?: string
  next?: boolean
  dateInPast?: boolean
  dateOverride?: DateTime
  changeFrom?: DateTime
}

export const completeLocationDateTimePage = ({
  index = 1,
  crnOverride = '',
  uuidOveride = '',
  dateInPast = false,
  dateOverride,
  changeFrom,
}: Props = {}) => {
  const suffix = index > 1 ? `-${index}` : ''
  const locationDateTimePage = new AppointmentLocationDateTimePage()
  const now = changeFrom || DateTime.now()
  const yesterday = DateTime.now().minus({ days: 1 })
  const future = DateTime.now().plus({ days: 2 })
  const yesterdayIsInCurrentMonth = yesterday.month === now.month
  const futureIsInCurrentMonth = future.month === now.month
  locationDateTimePage.getDatePickerToggle().click()
  if (dateOverride) {
    const diff = (dateOverride.year - now.year) * 12 + (dateOverride.month - now.month)
    if (diff < 0) {
      for (let i = 0; i > diff; i -= 1) {
        cy.get('.moj-js-datepicker-prev-month').click()
      }
    }
    if (diff > 0) {
      for (let i = 0; i < diff; i += 1) {
        cy.get('.moj-js-datepicker-next-month').click()
      }
    }
    cy.get(`[data-testid="${dateOverride.toFormat('d/M/yyyy')}"]`).click()
  } else if (!dateInPast) {
    if (!futureIsInCurrentMonth) {
      cy.get('.moj-js-datepicker-next-month').click()
    }
    cy.get(`[data-testid="${future.toFormat('d/M/yyyy')}"]`).click()
  } else {
    if (!yesterdayIsInCurrentMonth) {
      cy.get('.moj-js-datepicker-prev-month').click()
    }
    cy.get(`[data-testid="${yesterday.toFormat('d/M/yyyy')}"]`).click()
  }
  locationDateTimePage.getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-start`).type(startTime)
  locationDateTimePage
    .getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-end`)
    .focus()
    .type(endTime)
  locationDateTimePage
    .getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-user-locationCode${suffix}`)
    .click()
  locationDateTimePage.getSubmitBtn().click()
  locationDateTimePage.getSubmitBtn().click()
}
