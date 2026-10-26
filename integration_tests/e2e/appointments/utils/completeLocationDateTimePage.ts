import { DateTime } from 'luxon'
import AppointmentLocationDateTimePage from '../../../pages/appointments/location-date-time.page'
import EditContactDetails from '../../../pages/personalDetails/editContactDetails'
import { crn, uuid, startTime, endTime } from '../imports/common'

interface Props {
  index?: number
  crnOverride?: string
  uuidOveride?: string
  next?: boolean
  dateInPast?: boolean
  dateOverride?: DateTime
  allowSms?: boolean
}

export const completeLocationDateTimePage = ({
  index = 1,
  crnOverride = '',
  uuidOveride = '',
  dateInPast = false,
  dateOverride,
  allowSms = true,
}: Props = {}) => {
  const suffix = index > 1 ? `-${index}` : ''
  let locationDateTimePage = new AppointmentLocationDateTimePage()
  const yesterday = DateTime.now().minus({ days: 1 })
  const future = DateTime.now().plus({ days: 2 })
  if (dateOverride) {
    locationDateTimePage
      .getDatePickerInput()
      .clear()
      .type(`${dateOverride.toFormat('d/M/yyyy')}`)
  } else if (dateInPast) {
    locationDateTimePage
      .getDatePickerInput()
      .clear()
      .type(`${yesterday.toFormat('d/M/yyyy')}`)
  } else {
    locationDateTimePage
      .getDatePickerInput()
      .clear()
      .type(`${future.toFormat('d/M/yyyy')}`)
  }
  locationDateTimePage
    .getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-start`)
    .clear()
    .type(startTime)
  locationDateTimePage
    .getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-end`)
    .focus()
    .clear()
    .type(endTime)

  locationDateTimePage
    .getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-user-locationCode${suffix}`)
    .click()
  if (!allowSms) {
    cy.get('[data-qa=changeAllowSmsLink]').click()
    const editContactDetailsPage = new EditContactDetails()
    editContactDetailsPage.checkOnPage()
    cy.get('#mobileNumber').clear()
    cy.get('#mobileNumber').type('07800765432')
    cy.get('#allowSms-no').click()
    cy.get('[data-qa=submitBtn]').click()
    locationDateTimePage = new AppointmentLocationDateTimePage()
  }
  locationDateTimePage.getSubmitBtn().click()
  locationDateTimePage.getSubmitBtn().click()
}
