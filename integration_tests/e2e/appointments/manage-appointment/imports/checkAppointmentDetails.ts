import ManageAppointmentPage from '../../../../pages/appointments/manage-appointment.page'
import SentencePage from '../../../../pages/sentence'
import { loadPage } from './common'

interface Args {
  hasOutcome?: boolean
  deliusManaged?: boolean
  acceptableAbsence?: boolean
  hasComplied?: boolean
  enableNonCompliance?: boolean
  hasOutcomeText?: boolean
  isFuture?: boolean
}

const crn = 'X778160'

export const checkAppointmentDetails = (
  {
    deliusManaged = false,
    hasOutcome = false,
    acceptableAbsence = false,
    hasComplied = false,
    hasOutcomeText = false,
    enableNonCompliance = true,
    isFuture = true,
  }: Args = {} as Args,
) => {
  const args = { deliusManaged, hasOutcome, acceptableAbsence, hasComplied, enableNonCompliance, isFuture }
  let page: ManageAppointmentPage
  let sentencePage: SentencePage
  const manageAppointmentPage = new ManageAppointmentPage()
  let outcomeStatus = ''
  if (hasOutcome && hasComplied) outcomeStatus = 'Complied'
  if (hasOutcome && !hasComplied && !acceptableAbsence) outcomeStatus = 'Unacceptable absence'
  if (hasOutcome && !hasComplied && acceptableAbsence) outcomeStatus = 'Acceptable absence'
  const tagColour = outcomeStatus !== 'Unacceptable absence' ? 'green' : 'red'
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
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    })
  }
  if (deliusManaged && hasOutcome) {
    it('should display the outcome', () => {
      manageAppointmentPage.getAppointmentDetailsRowKey('outcomeRow').should('contain.text', 'Outcome')
      manageAppointmentPage
        .getAppointmentDetailsRowValue('outcomeRow')
        .should('contain.html', `<strong class="govuk-tag govuk-tag--${tagColour}`)
        .should('contain.text', outcomeStatus)
      manageAppointmentPage.getAppointmentDetailsRowActions('outcomeRow').should('not.exist')
    })
  }
  if (enableNonCompliance && !deliusManaged) {
    it('should display the sentence', () => {
      manageAppointmentPage.getAppointmentDetailsRowKey('sentenceRow').should('contain.text', 'Sentence')
      manageAppointmentPage
        .getAppointmentDetailsRowValue('sentenceRow')
        .should('contain.text', '12 month Community order')
      manageAppointmentPage
        .getAppointmentDetailsRowActions('sentenceRow')
        .find('a')
        .should('contain.text', 'View sentence details')
        .should('have.attr', 'href', `/case/${crn}/sentence`)
        .click()
      sentencePage = new SentencePage()
      sentencePage.checkOnPage()
    })
  }

  it(
    !deliusManaged
      ? 'should display the date and time with Reschedule link when date is in past'
      : 'should display the date and time with no Reschedule link',
    () => {
      if (enableNonCompliance) {
        cy.task('stubEnableNonCompliance')
      }
      cy.task('stubAppointment', { ...args, isFuture: false })
      loadPage()
      manageAppointmentPage.getAppointmentDetailsRowKey('dateTimeRow').should('contain.text', 'Date and time')
      manageAppointmentPage
        .getAppointmentDetailsRowValue('dateTimeRow')
        .should('contain.text', '21 February 2024 at 10:15am to 10:30am')
      if (!deliusManaged) {
        manageAppointmentPage
          .getAppointmentDetailsRowActions('dateTimeRow')
          .find('a')
          .should('contain.text', 'Reschedule')
          .should('have.attr', 'href', `/case/${crn}/appointment/6/reschedule`)
      } else {
        manageAppointmentPage.getAppointmentDetailsRowActions('dateTimeRow').should('not.exist')
      }
    },
  )

  it('should display the full location address', () => {
    manageAppointmentPage.getAppointmentDetailsRowKey('locationRow').should('contain.text', 'Location')
    manageAppointmentPage
      .getAppointmentDetailsRowValue('locationRow')
      .should('contain.html', 'The Building<br>77 Some Street<br>Some City Centre<br>London<br>Essex<br>NW10 1EP')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsRowActions('locationRow')
        .find('a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    } else {
      manageAppointmentPage.getAppointmentDetailsRowActions('locationRow').should('not.exist')
    }
  })
  it('should display only the office name for the location', () => {
    if (enableNonCompliance) {
      cy.task('stubEnableNonCompliance')
    }
    cy.task('stubAppointment', { ...args, locationOfficeName: true })
    cy.visit('/case/X778160/appointments/appointment/6/manage')
    page = new ManageAppointmentPage()
    manageAppointmentPage
      .getAppointmentDetailsRowValue('locationRow')
      .should('contain.text', 'Leamington Probation Office')
  })
  it('should display the attending officer', () => {
    if (enableNonCompliance) {
      cy.task('stubEnableNonCompliance')
    }
    cy.task('stubAppointment', { ...args })
    manageAppointmentPage.getAppointmentDetailsRowKey('attendingRow').should('contain.text', 'Attending')
    manageAppointmentPage.getAppointmentDetailsRowValue('attendingRow').should('contain.text', 'Terry Jones')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsRowActions('attendingRow')
        .find('a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    } else {
      manageAppointmentPage.getAppointmentDetailsRowActions('attendingRow').should('not.exist')
    }
  })
  it(`should display the RAR activity`, () => {
    if (enableNonCompliance) {
      cy.task('stubEnableNonCompliance')
    }
    cy.task('stubAppointment', {
      ...args,
      isFuture: true,
      hasRarActivity: true,
    })
    cy.visit('/case/X778160/appointments/appointment/6/manage')
    page = new ManageAppointmentPage()
    manageAppointmentPage.getAppointmentDetailsRowKey('rarActivityRow').should('contain.text', 'RAR activity')
    manageAppointmentPage.getAppointmentDetailsRowValue('rarActivityRow').should('contain.text', 'Stepping Stones')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsRowActions('rarActivityRow')
        .find('a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    } else {
      manageAppointmentPage.getAppointmentDetailsRowActions('rarActivityRow').should('not.exist')
    }
  })
  it('should not display RAR activity', () => {
    if (enableNonCompliance) {
      cy.task('stubEnableNonCompliance')
    }
    cy.task('stubAppointment', {
      ...args,
      isFuture: true,
      hasRarActivity: false,
    })
    cy.visit('/case/X778160/appointments/appointment/6/manage')
    manageAppointmentPage.getAppointmentDetailsRow('rarActivityRow').should('not.exist')
  })

  it('should display the VISOR report', () => {
    cy.task('stubAppointment', {
      ...args,
      hasRarActivity: true,
    })
    manageAppointmentPage.getAppointmentDetailsRowKey('visorReportRow').should('contain.text', 'VISOR report')
    manageAppointmentPage.getAppointmentDetailsRowValue('visorReportRow').should('contain.text', 'No')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsRowActions('visorReportRow')
        .find('a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    } else {
      manageAppointmentPage.getAppointmentDetailsRowActions('visorReportRow').should('not.exist')
    }
  })
  it('should display the correct values if notes added to appointment', () => {
    if (enableNonCompliance) {
      cy.task('stubEnableNonCompliance')
    }
    cy.task('stubAppointment', { ...args, notes: true })
    cy.visit('/case/X778160/appointments/appointment/6/manage')
    page = new ManageAppointmentPage()
    page.getAppointmentDetailsRowKey('appointmentNotesRow').should('contain.text', 'Appointment notes')
    page
      .getAppointmentDetailsRowValue('appointmentNotesRow')
      .find('.app-note')
      .eq(0)
      .find('p')
      .eq(0)
      .should('contain.text', 'Some notes')
    page
      .getAppointmentDetailsRowValue('appointmentNotesRow')
      .find('.app-note')
      .eq(0)
      .find('p')
      .eq(1)
      .should('contain.text', 'Comment added by Terry Jones on 6 April 2023')
    page
      .getAppointmentDetailsRowValue('appointmentNotesRow')
      .find('.app-note')
      .eq(1)
      .find('p')
      .eq(0)
      .should('contain.text', 'Some more notes')
    page
      .getAppointmentDetailsRowValue('appointmentNotesRow')
      .find('.app-note')
      .eq(1)
      .find('p')
      .eq(1)
      .should('contain.text', 'Comment added by Terry Jones on 7 April 2023')
    if (!deliusManaged) {
      page
        .getAppointmentDetailsRowActions('appointmentNotesRow')
        .find('a')
        .should('contain.text', 'Add to notes')
        .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
    }
  })

  it('should display the correct values if no notes added to appointment', () => {
    if (enableNonCompliance) {
      cy.task('stubEnableNonCompliance')
    }
    cy.task('stubAppointment', {
      ...args,
      isFuture: true,
      notes: false,
    })
    cy.visit('/case/X778160/appointments/appointment/6/manage')
    page = new ManageAppointmentPage()
    page.getAppointmentDetailsRowValue('appointmentNotesRow').should('contain.text', 'No notes')
    if (!deliusManaged) {
      page
        .getAppointmentDetailsRowActions('appointmentNotesRow')
        .find('a')
        .should('contain.text', 'Change')
        .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
    }
  })

  if (hasOutcomeText) {
    it('should display the outcome text', () => {
      if (enableNonCompliance) {
        cy.task('stubEnableNonCompliance')
      }
      cy.task('stubAppointmentWithOutcomeText')
      cy.visit('/case/X778160/appointments/appointment/6/manage')
      page = new ManageAppointmentPage()
      page.getAppointmentDetailsRowKey('mpopOutcomeRow').should('contain.text', 'Outcome')
      page.getAppointmentDetailsRowValue('mpopOutcomeRow').should('contain.text', 'Recalled to custody')
      page.getAppointmentDetailsRowActions('mpopOutcomeRow').should('not.exist')
    })
  }
  it('should display sensitive', () => {
    if (enableNonCompliance) {
      cy.task('stubEnableNonCompliance')
    }
    cy.task('stubAppointment', { ...args })
    cy.visit('/case/X778160/appointments/appointment/6/manage')
    page = new ManageAppointmentPage()
    page.getAppointmentDetailsRowKey('sensitiveRow').should('contain.text', 'Sensitive')
    page.getAppointmentDetailsRowValue('sensitiveRow').should('contain.text', 'No')
    if (!deliusManaged) {
      page
        .getAppointmentDetailsRowActions('sensitiveRow')
        .find('a')
        .should('contain.text', 'Change')
        .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
    }
  })
}
