import AddNotePage from '../../pages/appointmentOutcomes/add-note.page'
import UpdateEnforcementActionPage from '../../pages/appointmentOutcomes/update-enforcement-action.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import { crn, appointmentId } from '../appointments/imports/common'

let manageAppointmentPage: ManageAppointmentPage
let updateEnforcementActionPage: UpdateEnforcementActionPage
let addNotePage: AddNotePage

const loadPage = (): void => {
  cy.task('stubAppointment', {
    eventId: 2501192724,
    isFuture: false,
    hasOutcome: true,
    hasComplied: false,
    notes: false,
    acceptableAbsence: false,
    action: 'First Warning Letter Sent',
    outcome: 'Attended - Failed To Comply',
    enforcementAction: {
      code: 'EA02',
      description: 'First Warning Letter Sent',
    },
  })

  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
  manageAppointmentPage = new ManageAppointmentPage()
  manageAppointmentPage.getTaskLink(2).click()
}

describe('Update enforcement action', () => {
  it('should render the page', () => {
    loadPage()
    updateEnforcementActionPage = new UpdateEnforcementActionPage()
    updateEnforcementActionPage.checkPageTitle(`Update enforcement action for Alton’s failure to comply`)
  })
  it('should show a validation error', () => {
    const msg = 'Select another enforcement action'
    loadPage()
    updateEnforcementActionPage = new UpdateEnforcementActionPage()
    updateEnforcementActionPage.getSubmitBtn().click()
    updateEnforcementActionPage.checkErrorSummaryBox([msg])
    cy.get(`#appointments-${crn}-${appointmentId}-outcome-updateEnforcementAction-error`).should('contain.text', msg)
  })
  it('should submit the page', () => {
    loadPage()
    updateEnforcementActionPage = new UpdateEnforcementActionPage()
    cy.get(`.govuk-radios__input[value=NO_FURTHER_ACTION]`).click()
    updateEnforcementActionPage.getSubmitBtn().click()
    addNotePage = new AddNotePage()
    addNotePage.checkOnPage()
  })
})
