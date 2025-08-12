describe('Manage an appointment', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })
  const loadPage = () => {
    cy.visit('/case/X778160/appointments/appointment/6/manage')
  }
  describe('Appointment type can be managed in MPOP', () => {
    describe('Appointment is in the future', () => {
      describe('appointment has no notes', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubNoNextAppointmentWithCOM')
          loadPage()
        })
        it('should render the correct page', () => {
          cy.get('h2').should('contain.text', 'Manage 3 Way Meeting (NS) with Terry Jones')
        })
        it('should not display the alert banner', () => {
          cy.get('[data-qa="appointmentAlert"]').should('not.exist')
        })
        it(`should display not display a link to log attended and complied`, () => {
          cy.get(
            '[data-qa="appointmentActions"] li:nth-child(1) .govuk-task-list__name-and-hint div:nth-child(1)',
          ).should('contain.text', 'Log attended and complied appointment')
          cy.get(
            '[data-qa="appointmentActions"] li:nth-child(1) .govuk-task-list__name-and-hint .govuk-task-list__link',
          ).should('not.exist')
        })
        it('should display the hint text for log attended and complied task', () => {
          cy.get(
            '[data-qa="appointmentActions"] li:nth-child(1) .govuk-task-list__name-and-hint .govuk-task-list__hint',
          ).should(
            'contain.text',
            'You cannot log an attended and complied outcome until the appointment has happened.',
          )
        })
        it(`should display the status of log attended and complied as 'Not started'`, () => {
          cy.get('[data-qa="appointmentActions"] li:nth-child(1) .govuk-task-list__status')
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
        it(`should display the status of add appointment notes as 'Not started'`, () => {})
        it(`should display the status of arrange next appointment as 'Not started'`, () => {})
      })
      /*
      describe('appointment has notes', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeWithNotes')
          loadPage()
        })
      })
      describe('No next appointment scheduled with COM', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubNoUpcomingAppointmentWithOfficer')
          loadPage()
        })
      })
      describe('next appointment scheduled with COM', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubHasUpcomingAppointmentWithOfficer')
          loadPage()
        })
      })
      describe('appointment has documents', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeWithDocs')
          loadPage()
        })
      })
      describe(`appointment is at POP's home address`, () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentHomeAddress')
          loadPage()
        })
      })
        */
    })

    /*
    describe('Appointment is in the past', () => {
      describe('appointment with attended and complied not logged', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentManagedTypeNoOutcomeLogged')
          loadPage()
        })
      })
      describe('appointment with attended and complied already logged', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentManagedTypeOutcomeLogged')
          loadPage()
        })
      })
    })
      */
  })

  /*
  describe('Appointment type cannot be managed in MPOP', () => {
    it('should render the page', () => {
      beforeEach(() => {
        cy.task('stubAppointmentInvalidTypeCompliedOutcome')
        loadPage()
      })
    })
    it('should render the page for an appointment with an unacceptable absence outcome', () => {
      cy.task('stubAppointmentInvalidTypeUnacceptableAbsenceOutcome')
    })
  })
    */
})
