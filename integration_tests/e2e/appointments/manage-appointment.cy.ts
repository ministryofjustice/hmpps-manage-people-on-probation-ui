import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'

const loadPage = () => {
  cy.visit('/case/X778160/appointments/appointment/6/manage')
}
interface Args {
  hasOutcome?: boolean
  deliusManagedType?: boolean
  notCompliedAbsence?: boolean
  hasComplied?: boolean
  task?: string
  withNotesTask?: string
  noNotesTask?: string
}

const checkAppointmentDetails = (
  {
    task,
    withNotesTask,
    noNotesTask,
    deliusManagedType = false,
    notCompliedAbsence = false,
    hasComplied = false,
  }: Args = {} as Args,
) => {
  let page: ManageAppointmentPage
  const manageAppointmentPage = new ManageAppointmentPage()
  const deliusManaged = deliusManagedType || notCompliedAbsence
  const hasOutcome = notCompliedAbsence || hasComplied
  const outcomeStatus = hasComplied ? 'Complied' : 'Unacceptable absence'
  const tagColour = hasComplied ? 'green' : 'red'
  if (!deliusManaged) {
    it('should display the NDelius change links text for MPOP managed appointments', () => {
      manageAppointmentPage
        .getAppointmentDetails()
        .find('.govuk-body')
        .should('contain.text', 'All links to change appointment details on NDelius open in a new tab.')
    })
  } else {
    it('should display the manage appointment on NDelius link', () => {
      manageAppointmentPage
        .getAppointmentDetails()
        .find('.govuk-body a')
        .should('contain.text', 'Manage this appointment on NDelius (opens in a new tab)')
        .should('have.attr', 'target', '_blank')
        .should('have.attr', 'href', '#')
    })
  }
  if (deliusManaged && hasOutcome) {
    it('should display the outcome', () => {
      manageAppointmentPage.getAppointmentDetailsListItem(1, 'key').should('contain.text', 'Outcome')
      manageAppointmentPage
        .getAppointmentDetailsListItem(1, 'value')
        .should('contain.html', `<strong class="govuk-tag govuk-tag--${tagColour}`)
        .should('contain.text', outcomeStatus)
      manageAppointmentPage.getAppointmentDetailsListItem(1, 'actions').should('not.exist')
    })
  }
  it('should display the date and time', () => {
    const index = !deliusManaged || (deliusManaged && !hasOutcome) ? 1 : 2
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Date and time')
    manageAppointmentPage
      .getAppointmentDetailsListItem(index, 'value')
      .should('contain.text', '21 February 2024 at 10:15am to 10:30am')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
    } else {
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
    }
  })
  it('should display the location', () => {
    const index = !deliusManaged || (deliusManaged && !hasOutcome) ? 2 : 3
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Location')
    manageAppointmentPage
      .getAppointmentDetailsListItem(index, 'value')
      .should('contain.html', 'The Building<br>77 Some Street<br>Some City Centre<br>London<br>Essex<br>NW10 1EP')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
    } else {
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
    }
  })
  it('should display the attending officer', () => {
    const index = !deliusManaged || (deliusManaged && !hasOutcome) ? 3 : 4
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Attending')
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'value').should('contain.text', 'Terry Jones')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
    } else {
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
    }
  })
  if (notCompliedAbsence) {
    it(`should display the RAR activity as 'Not provided'`, () => {
      manageAppointmentPage.getAppointmentDetailsListItem(5, 'key').should('contain.text', 'RAR activity')
      manageAppointmentPage.getAppointmentDetailsListItem(5, 'value').should('contain.text', 'Not provided')
      manageAppointmentPage.getAppointmentDetailsListItem(5, 'actions').should('not.exist')
    })
    it(`should display the RAR activity`, () => {
      cy.task('stubAppointmentUnacceptableAbsenceWithRAR')
      loadPage()
      page = new ManageAppointmentPage()
      manageAppointmentPage.getAppointmentDetailsListItem(5, 'value').should('contain.text', 'Stepping Stones')
    })
  }
  it('should display the VISOR report', () => {
    let index = 4
    if (hasComplied) index = 5
    if (notCompliedAbsence) index = 6
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'VISOR report')
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'value').should('contain.text', 'No')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change')
        .should('have.attr', 'href', '#')
    } else {
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
    }
  })
  if (!notCompliedAbsence) {
    it('should display the correct values if notes added to appointment', () => {
      let index = 5
      if (hasComplied) index = 6
      if (notCompliedAbsence) index = 7
      cy.task(withNotesTask ?? 'stubFutureAppointmentManagedTypeWithNotes')
      loadPage()
      page = new ManageAppointmentPage()
      page.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Appointment notes')
      page
        .getAppointmentDetailsListItem(index, 'value')
        .find('.app-note')
        .eq(0)
        .find('p')
        .eq(0)
        .should('contain.text', 'Some notes')
      page
        .getAppointmentDetailsListItem(index, 'value')
        .find('.app-note')
        .eq(0)
        .find('p')
        .eq(1)
        .should('contain.text', 'Comment added by Terry Jones on 6 April 2023')
      page
        .getAppointmentDetailsListItem(index, 'value')
        .find('.app-note')
        .eq(1)
        .find('p')
        .eq(0)
        .should('contain.text', 'Some more notes')
      page
        .getAppointmentDetailsListItem(index, 'value')
        .find('.app-note')
        .eq(1)
        .find('p')
        .eq(1)
        .should('contain.text', 'Comment added by Terry Jones on 7 April 2023')
      if (!deliusManaged) {
        page
          .getAppointmentDetailsListItem(index, 'actions')
          .find('a')
          .should('contain.text', 'Add to notes')
          .should('have.attr', 'href', '#')
      }
    })

    it('should display the correct values if no notes added to appointment', () => {
      let index = 5
      if (hasComplied) index = 6
      if (notCompliedAbsence) index = 7
      cy.task(noNotesTask ?? 'stubFutureAppointmentManagedTypeNoNotes')
      loadPage()
      page = new ManageAppointmentPage()
      page.getAppointmentDetailsListItem(index, 'value').should('contain.text', 'No notes')
      if (!deliusManaged) {
        page
          .getAppointmentDetailsListItem(index, 'actions')
          .find('a')
          .should('contain.text', 'Change')
          .should('have.attr', 'href', '#')
      }
    })
  }

  it('should display sensitive', () => {
    let index = 6
    if (hasComplied) index = 7
    if (notCompliedAbsence) index = 8
    if (task) {
      cy.task(task)
    }
    loadPage()
    page = new ManageAppointmentPage()
    page.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Sensitive')
    page.getAppointmentDetailsListItem(index, 'value').should('contain.text', 'No')
    if (!deliusManaged) {
      page
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change')
        .should('have.attr', 'href', '#')
    }
  })
}

describe('Manage an appointment', () => {
  let manageAppointmentPage: ManageAppointmentPage
  beforeEach(() => {
    cy.task('resetMocks')
    loadPage()
    manageAppointmentPage = new ManageAppointmentPage()
  })
  it('should render the page', () => {
    manageAppointmentPage.setPageTitle('Manage Planned Office Visit (NS) with Terry Jones')
    manageAppointmentPage.getLastUpdated().should('contain.text', 'Last updated by Paul Smith on 20 March 2023')
  })
  describe('Alert banner', () => {
    describe('Appointment is in the future', () => {
      beforeEach(() => {
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should not show the alert', () => {
        manageAppointmentPage.getAlertBanner().should('not.exist')
      })
    })
    describe('Appointment is in the past', () => {
      describe('Outcome not logged and no notes', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentNoOutcomeNoNotes')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the alert banner with the correct message', () => {
          manageAppointmentPage
            .getAlertBanner()
            .should('contain.text', 'You must log an outcome and should add notes to this appointment.')
        })
      })
      describe('Outcome logged and no notes', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the alert banner with the correct message', () => {
          manageAppointmentPage.getAlertBanner().should('contain.text', 'You should add notes to this appointment.')
        })
      })
    })
  })

  describe('Appointment with no documents', () => {
    beforeEach(() => {
      cy.task('stubFutureAppointmentManagedTypeWithNotes')
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    it('should render the page without associated documents', () => {
      manageAppointmentPage.getAssociatedDocuments().should('not.exist')
    })
  })

  describe('Appointment actions', () => {
    beforeEach(() => {
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    it('should display the section title', () => {
      manageAppointmentPage.getAppointmentActions().find('h3').should('contain.text', 'Appointment actions')
    })
    it('should display the inset text and MDelius link', () => {
      manageAppointmentPage.getAppointmentActions().find('.govuk-inset-text').should('contain.text', 'You must')
      manageAppointmentPage
        .getAppointmentActions()
        .find('.govuk-inset-text a')
        .should('contain.text', 'use NDelius to log non-attendance or non-compliance (opens in new tab)')
        .should('have.attr', 'target', '_blank')
        .should('have.attr', 'href', '#')
    })

    describe('Log attended and complied appointment', () => {
      const name = 'Log attended and complied appointment'
      beforeEach(() => {
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      describe('Appointment is in the future', () => {
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(1).should('contain.text', name)
        })
        it('should not display a link to log the outcome', () => {
          manageAppointmentPage.getTaskLink(1).should('not.exist')
        })
        it('should display the hint text', () => {
          manageAppointmentPage
            .getTaskHint(1)
            .should(
              'contain.text',
              'You cannot log an attended and complied outcome until the appointment has happened',
            )
        })
        it(`should display the status as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(1)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in the past, with no outcome logged', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentNoOutcomeNoNotes')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to log the outcome', () => {
          manageAppointmentPage
            .getTaskLink(1)
            .should('contain.text', name)
            .should('have.attr', 'href', '/case/X778160/appointments/appointment/6/record-an-outcome')
        })
        it(`should display the status as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(1)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in the past with an outcome logged', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(1).should('contain.text', name)
        })
        it('should not display a link to log the outcome', () => {
          manageAppointmentPage.getTaskLink(1).should('not.exist')
        })
        it(`should display the status as 'Complied'`, () => {
          manageAppointmentPage
            .getTaskStatus(1)
            .should('contain.html', 'class="govuk-tag govuk-tag--green"')
            .should('contain.text', 'Complied')
        })
      })
    })
  })

  describe('Appointment type is NDelius managed', () => {
    beforeEach(() => {
      cy.task('stubAppointmentNDeliusManagedType')
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    it('should not display the appointment actions', () => {
      manageAppointmentPage.getAppointmentActions().should('not.exist')
    })
  })

  describe('Add appointment notes', () => {
    const name = 'Add appointment notes'
    describe('Appointment in future and has no notes', () => {
      beforeEach(() => {
        cy.task('stubFutureAppointmentManagedTypeNoNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to add appointment notes', () => {
        manageAppointmentPage.getTaskLink(2).should('contain.text', name).should('have.attr', 'href', '#')
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
        manageAppointmentPage.getTaskLink(2).should('contain.text', name).should('have.attr', 'href', '#')
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
        manageAppointmentPage.getTaskLink(2).should('contain.text', name).should('have.attr', 'href', '#')
      })
      it(`should display the status tag as 'Not started'`, () => {
        manageAppointmentPage
          .getTaskStatus(2)
          .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
          .should('contain.text', 'Not started')
      })
    })
    describe('Appointment in past and has notes', () => {
      beforeEach(() => {
        cy.task('stubPastAppointmentWithNotes')
        loadPage()
        manageAppointmentPage = new ManageAppointmentPage()
      })
      it('should display a link to add appointment notes', () => {
        manageAppointmentPage.getTaskLink(2).should('contain.text', name).should('have.attr', 'href', '#')
      })
      it(`should display the status as 'Completed'`, () => {
        manageAppointmentPage
          .getTaskStatus(2)
          .should('not.contain.html', 'class="govuk-tag')
          .should('contain.text', 'Completed')
      })
    })
  })
  describe('Arrange next appointment', () => {
    const name = 'Arrange next appointment'
    describe('Logged in user is COM', () => {
      describe('Appointment is in future with no next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubIsComNoNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('contain.text', name).should('have.attr', 'href', '#')
        })
        it('should display the hint text', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'You do not have any other appointments arranged with Eula.')
        })
        it(`should display the status tag as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in future with next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubIsComNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(3).should('contain.text', name)
        })
        it('should not display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('not.exist')
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at The Building on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in the future with next appointment arranged at POP home address', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubIsComNextAppointmentAtHome')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at their home on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in past with no next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          cy.task('stubIsComNoNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('contain.text', name).should('have.attr', 'href', '#')
        })
        it('should display the hint text', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'You do not have any other appointments arranged with Eula.')
        })
        it(`should display the status tag as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in past with next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          cy.task('stubIsComNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(3).should('contain.text', name)
        })
        it('should not display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('not.exist')
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at The Building on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in the past with next appointment arranged at POP home address', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          cy.task('stubIsComNextAppointmentAtHome')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at their home on 21 February 2024.')
        })
      })
    })
    describe('Logged in user is not COM', () => {
      describe('Appointment is in future with no next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubNotComNoNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('contain.text', name).should('have.attr', 'href', '#')
        })
        it('should display the hint text', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Terry does not have any other appointments arranged with Eula.')
        })
        it(`should display the status tag as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in future with next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubNotComNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(3).should('contain.text', name)
        })
        it('should not display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('not.exist')
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at The Building on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in future with next appointment arranged at POP home address', () => {
        beforeEach(() => {
          cy.task('stubFutureAppointmentManagedTypeNoNotes')
          cy.task('stubNotComNextAppointmentAtHome')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(3).should('contain.text', name)
        })
        it('should not display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('not.exist')
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at their home on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in past with no next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          cy.task('stubNotComNoNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('contain.text', name).should('have.attr', 'href', '#')
        })
        it('should display the hint text', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Terry does not have any other appointments arranged with Eula.')
        })
        it(`should display the status tag as 'Not started'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('contain.html', 'class="govuk-tag govuk-tag--blue"')
            .should('contain.text', 'Not started')
        })
      })
      describe('Appointment is in past with next appointment arranged', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          cy.task('stubNotComNextAppointment')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(3).should('contain.text', name)
        })
        it('should not display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('not.exist')
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at The Building on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
      describe('Appointment is in the past with next appointment arranged at POP home address', () => {
        beforeEach(() => {
          cy.task('stubPastAppointmentOutcomeNoNotes')
          cy.task('stubNotComNextAppointmentAtHome')
          loadPage()
          manageAppointmentPage = new ManageAppointmentPage()
        })
        it('should display the task name', () => {
          manageAppointmentPage.getTaskName(3).should('contain.text', name)
        })
        it('should not display a link to arrange next appointment', () => {
          manageAppointmentPage.getTaskLink(3).should('not.exist')
        })
        it('should display the appointment details in the hint', () => {
          manageAppointmentPage
            .getTaskHint(3)
            .should('contain.text', 'Other call arranged with Eula at their home on 21 February 2024.')
        })
        it(`should display the status as 'Completed'`, () => {
          manageAppointmentPage
            .getTaskStatus(3)
            .should('not.contain.html', 'class="govuk-tag')
            .should('contain.text', 'Completed')
        })
      })
    })
  })
  describe('Appointment details', () => {
    beforeEach(() => {
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    it('should display the section title', () => {
      manageAppointmentPage.getAppointmentDetails().find('h3').should('contain.text', 'Appointment details')
    })
    describe('MPOP managed appointment', () => {
      checkAppointmentDetails()
    })
    describe('Delius managed appointment type, no outcome', () => {
      beforeEach(() => {
        cy.task('stubAppointmentNDeliusManagedType')
        loadPage()
      })
      checkAppointmentDetails({
        task: 'stubAppointmentNDeliusManagedType',
        noNotesTask: 'stubAppointmentNDeliusManagedTypeNoNotesNoOutcome',
        withNotesTask: 'stubAppointmentNDeliusManagedTypeWithNotesNoOutcome',
        deliusManagedType: true,
      })
    })
    describe('Delius managed appointment type, complied', () => {
      beforeEach(() => {
        cy.task('stubAppointmentNDeliusManagedTypeComplied')
        loadPage()
      })
      checkAppointmentDetails({
        task: 'stubAppointmentNDeliusManagedTypeComplied',
        noNotesTask: 'stubAppointmentNDeliusManagedTypeNoNotesHasOutcome',
        withNotesTask: 'stubAppointmentNDeliusManagedTypeWithNotesHasOutcome',
        deliusManagedType: true,
        hasComplied: true,
      })
    })
    describe('Delius managed appointment, unacceptable absence', () => {
      beforeEach(() => {
        cy.task('stubAppointmentUnacceptableAbsenceNoNotes')
        loadPage()
      })
      checkAppointmentDetails({
        task: 'stubAppointmentUnacceptableAbsenceNoNotes',
        noNotesTask: 'stubAppointmentUnacceptableAbsenceNoNotes',
        withNotesTask: 'stubAppointmentUnacceptableAbsenceWithNotes',
        deliusManagedType: true,
        hasComplied: false,
        notCompliedAbsence: true,
      })
    })
  })

  describe('Associated documents', () => {
    beforeEach(() => {
      cy.task('stubFutureAppointmentManagedTypeWithDocs')
      loadPage()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    it('should display the associated documents section', () => {
      manageAppointmentPage.getAssociatedDocuments().find('h3').should('contain.text', 'Associated documents')
      manageAppointmentPage
        .getAssociatedDocuments()
        .find('p.govuk-body')
        .should('contain.text', 'Documents associated with this appointment')
      manageAppointmentPage.getAssociatedDocumentsTableColumnHeading(1).should('contain.text', 'Name')
      manageAppointmentPage.getAssociatedDocumentsTableColumnHeading(2).should('contain.text', 'Level')
      manageAppointmentPage.getAssociatedDocumentsTableColumnHeading(3).should('contain.text', 'Type')
      manageAppointmentPage.getAssociatedDocumentsTableColumnHeading(4).should('contain.text', 'Date created')
      manageAppointmentPage.getAssociatedDocumentsTableColumnHeading(5).should('contain.text', 'Date modified')
      manageAppointmentPage.getAssociatedDocumentsTableRows().should('have.length', 3)
      manageAppointmentPage
        .getAssociatedDocumentsTableRowCell(1, 1)
        .find('a')
        .should('contain.text', 'Document-1.pdf')
        .should('have.attr', 'href', 'personal-details/documents/83fdbf8a-a2f2-43b4-93ef-67e71c04fc58/download')
      manageAppointmentPage.getAssociatedDocumentsTableRowCell(1, 2).should('contain.text', 'Contact')
      manageAppointmentPage.getAssociatedDocumentsTableRowCell(1, 3).should('contain.text', '3 Way Meeting (NS)')
      manageAppointmentPage.getAssociatedDocumentsTableRowCell(1, 4).should('contain.text', '6 April 2023')
      manageAppointmentPage.getAssociatedDocumentsTableRowCell(1, 5).should('contain.text', '6 April 2023')
    })
  })
})
