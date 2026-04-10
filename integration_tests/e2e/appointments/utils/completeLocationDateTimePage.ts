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
}

export const completeLocationDateTimePage = ({
  index = 1,
  crnOverride = '',
  uuidOveride = '',
  dateInPast = false,
  dateOverride,
}: Props = {}) => {
  const suffix = index > 1 ? `-${index}` : ''
  const locationDateTimePage = new AppointmentLocationDateTimePage()
  const yesterday = DateTime.now().setZone('Europe/London').minus({ days: 1 })
  const future = DateTime.now().setZone('Europe/London').plus({ days: 2 })
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
