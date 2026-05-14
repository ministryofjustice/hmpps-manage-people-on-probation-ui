import AttendedCompliedPage from '../../../pages/appointments/attended-complied.page'
import { crn, uuid } from '../imports/common'

export const completeAttendedCompliedPage = ({
  manageJourney = false,
  _crn = crn,
  _uuid = uuid,
}: { manageJourney?: boolean; _crn?: string; _uuid?: string } = {}) => {
  const idPrefix = manageJourney ? '' : `appointments-${_crn}-${_uuid}-`
  const logOutcomePage = new AttendedCompliedPage()
  cy.get(`#${idPrefix}outcomeRecorded`).click()
  logOutcomePage.getSubmitBtn().click()
}
