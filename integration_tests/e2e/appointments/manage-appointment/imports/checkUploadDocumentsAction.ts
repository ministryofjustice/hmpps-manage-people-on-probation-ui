import ManageAppointmentPage from '../../../../pages/appointments/manage-appointment.page'
import { crn, loadPage } from './common'

export const checkUploadDocumentsAction = () => {
  let manageAppointmentPage: ManageAppointmentPage
  const name = 'Upload documents'
  describe('Upload documents action', () => {
    describe('Appointment has associated documents', () => {
      beforeEach(() => {
        cy.task('stubAppointment', { isFuture: true, deliusManaged: false, documents: true })
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to upload document', () => {
        manageAppointmentPage
          .getTaskLink(3)
          .should('contain.text', name)
          .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/upload-file`)
      })
      it(`should display the status as 'Uploaded'`, () => {
        manageAppointmentPage
          .getTaskStatus(3)
          .should('not.contain.html', 'class="govuk-tag')
          .should('contain.text', 'Uploaded')
      })
    })
    describe('Appointment does not have associated documents', () => {
      beforeEach(() => {
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to upload document', () => {
        manageAppointmentPage
          .getTaskLink(3)
          .should('contain.text', name)
          .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/upload-file`)
      })
      it(`should display the status as 'No documents'`, () => {
        manageAppointmentPage
          .getTaskStatus(3)
          .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
          .should('contain.text', 'No documents')
      })
    })
  })
}
