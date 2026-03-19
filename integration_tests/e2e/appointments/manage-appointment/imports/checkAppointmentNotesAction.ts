import ManageAppointmentPage from '../../../../pages/appointments/manage-appointment.page'
import { loadPage, crn } from './common'

export const checkAppointmentNotesAction = () => {
  let manageAppointmentPage: ManageAppointmentPage
  describe('Add appointment notes action', () => {
    const name = 'Add appointment notes'
    describe('Appointment in future and has no notes', () => {
      beforeEach(() => {
        cy.task('stubFutureAppointmentManagedTypeNoNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to add appointment notes', () => {
        manageAppointmentPage
          .getTaskLink(2)
          .should('contain.text', name)
          .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
      })
      it(`should display the status tag as 'Not started'`, () => {
        manageAppointmentPage
          .getTaskStatus(2)
          .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
          .should('contain.text', 'Not started')
      })
    })
    describe('Appointment in future and has notes', () => {
      beforeEach(() => {
        cy.task('stubFutureAppointmentManagedTypeWithNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to add appointment notes', () => {
        manageAppointmentPage
          .getTaskLink(2)
          .should('contain.text', name)
          .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
      })
      it(`should display the status tag as 'In progress'`, () => {
        manageAppointmentPage
          .getTaskStatus(2)
          .should('contain.html', 'class="govuk-tag govuk-tag--yellow"')
          .should('contain.text', 'In progress')
      })
    })
    describe('Appointment in past and has no notes', () => {
      beforeEach(() => {
        cy.task('stubPastAppointmentNoOutcomeNoNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to add appointment notes', () => {
        manageAppointmentPage
          .getTaskLink(2)
          .should('contain.text', name)
          .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
      })
      it(`should display the status tag as 'Not started'`, () => {
        manageAppointmentPage
          .getTaskStatus(2)
          .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
          .should('contain.text', 'Not started')
      })
    })
    describe('Appointment in past no outcome recorded and has notes', () => {
      beforeEach(() => {
        cy.task('stubPastAppointmentNoOutcomeHasNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to add appointment notes', () => {
        manageAppointmentPage
          .getTaskLink(2)
          .should('contain.text', name)
          .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
      })
      it(`should display the status tag as 'In Progress'`, () => {
        manageAppointmentPage
          .getTaskStatus(2)
          .should('contain.html', 'class="govuk-tag govuk-tag--yellow"')
          .should('contain.text', 'In progress')
      })
    })
    describe('Appointment in past has outcome recorded and has notes', () => {
      beforeEach(() => {
        cy.task('stubPastAppointmentOutcomeHasNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to add appointment notes', () => {
        manageAppointmentPage
          .getTaskLink(2)
          .should('contain.text', name)
          .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
      })
      it(`should display the status tag as 'Completed'`, () => {
        manageAppointmentPage
          .getTaskStatus(2)
          .should('not.contain.html', 'class="govuk-tag"')
          .should('contain.text', 'Completed')
      })
    })
    describe('Appointment in future has outcome recorded and has notes', () => {
      beforeEach(() => {
        cy.task('stubFutureAppointmentOutcomeHasNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to add appointment notes', () => {
        manageAppointmentPage
          .getTaskLink(2)
          .should('contain.text', name)
          .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
      })
      it(`should display the status tag as 'Completed'`, () => {
        manageAppointmentPage
          .getTaskStatus(2)
          .should('not.contain.html', 'class="govuk-tag"')
          .should('contain.text', 'Completed')
      })
    })
    describe('Appointment in past and has notes', () => {
      beforeEach(() => {
        cy.task('stubPastAppointmentWithNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to add appointment notes', () => {
        manageAppointmentPage
          .getTaskLink(2)
          .should('contain.text', name)
          .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
      })
      it(`should display the status as 'In progress'`, () => {
        manageAppointmentPage
          .getTaskStatus(2)
          .should('contain.html', 'class="govuk-tag govuk-tag--yellow')
          .should('contain.text', 'In progress')
      })
    })
  })
}
