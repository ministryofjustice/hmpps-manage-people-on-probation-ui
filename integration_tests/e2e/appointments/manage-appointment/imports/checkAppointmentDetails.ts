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
      manageAppointmentPage.getAppointmentDetailsListItem(1, 'key').should('contain.text', 'Outcome')
      manageAppointmentPage
        .getAppointmentDetailsListItem(1, 'value')
        .should('contain.html', `<strong class="govuk-tag govuk-tag--${tagColour}`)
        .should('contain.text', outcomeStatus)
      manageAppointmentPage.getAppointmentDetailsListItem(1, 'actions').should('not.exist')
    })
  }
  if (enableNonCompliance && !deliusManaged) {
    it('should display the sentence', () => {
      manageAppointmentPage.getAppointmentDetailsListItem(1, 'key').should('contain.text', 'Sentence')
      manageAppointmentPage.getAppointmentDetailsListItem(1, 'value').should('contain.text', '12 month Community order')
      manageAppointmentPage
        .getAppointmentDetailsListItem(1, 'actions')
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
      let index = deliusManaged && hasOutcome ? 2 : 1
      if (enableNonCompliance && !deliusManaged) index += 1
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Date and time')
      manageAppointmentPage
        .getAppointmentDetailsListItem(index, 'value')
        .should('contain.text', '21 February 2024 at 10:15am to 10:30am')
      if (!deliusManaged) {
        manageAppointmentPage
          .getAppointmentDetailsListItem(index, 'actions')
          .find('a')
          .should('contain.text', 'Reschedule')
          .should('have.attr', 'href', `/case/${crn}/appointment/6/reschedule`)
      } else {
        manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
      }
    },
  )

  it('should display the full location address', () => {
    let index = deliusManaged && hasOutcome ? 3 : 2
    if (enableNonCompliance && !deliusManaged) index += 1
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
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    } else {
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
    }
  })
  it('should display only the office name for the location', () => {
    let index = deliusManaged && hasOutcome ? 3 : 2
    if (enableNonCompliance && !deliusManaged) index += 1
    if (enableNonCompliance) {
      cy.task('stubEnableNonCompliance')
    }
    cy.task('stubAppointment', { ...args, locationOfficeName: true })
    cy.visit('/case/X778160/appointments/appointment/6/manage')
    page = new ManageAppointmentPage()
    manageAppointmentPage
      .getAppointmentDetailsListItem(index, 'value')
      .should('contain.text', 'Leamington Probation Office')
  })
  it('should display the attending officer', () => {
    if (enableNonCompliance) {
      cy.task('stubEnableNonCompliance')
    }
    cy.task('stubAppointment', { ...args })
    let index = deliusManaged && hasOutcome ? 4 : 3
    if (enableNonCompliance && !deliusManaged) index += 1
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Attending')
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'value').should('contain.text', 'Terry Jones')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    } else {
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
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
    let index = deliusManaged && hasOutcome ? 5 : 4
    if (enableNonCompliance && !deliusManaged) index += 1
    page = new ManageAppointmentPage()
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'RAR activity')
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'value').should('contain.text', 'Stepping Stones')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    } else {
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
    }
  })
  it('should NOT display RAR activity when no RAR category is present', () => {
    if (enableNonCompliance) {
      cy.task('stubEnableNonCompliance')
    }
    cy.task('stubAppointment', {
      ...args,
      isFuture: true,
      hasRarActivity: false,
    })
    cy.visit('/case/X778160/appointments/appointment/6/manage')
    let index = hasOutcome && deliusManaged ? 5 : 4
    if (enableNonCompliance && !deliusManaged) index += 1
    manageAppointmentPage.getRarActivityRow().should('not.exist')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    } else {
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
    }
  })

  it('should display the VISOR report', () => {
    let index = deliusManaged && hasOutcome ? 6 : 5
    if (enableNonCompliance && !deliusManaged) index += 1

    manageAppointmentPage.getVisorReportRow().find('.govuk-summary-list__key').should('contain.text', 'VISOR report')

    manageAppointmentPage.getVisorReportRow().find('.govuk-summary-list__value').should('contain.text', 'No')

    if (!deliusManaged) {
      manageAppointmentPage
        .getVisorReportRow()
        .find('.govuk-summary-list__actions a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    } else {
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
    }
  })
  it('should display the correct values if notes added to appointment', () => {
    let index = deliusManaged && hasOutcome ? 6 : 5
    if (enableNonCompliance && !deliusManaged) index += 1
    if (enableNonCompliance) {
      cy.task('stubEnableNonCompliance')
    }
    cy.task('stubAppointment', { ...args, notes: true })
    cy.visit('/case/X778160/appointments/appointment/6/manage')
    page = new ManageAppointmentPage()
    page.getAppointmentNotesRow().find('.govuk-summary-list__key').should('contain.text', 'Appointment notes')

    page.getAppointmentNotesRow().find('.app-note').eq(0).find('p').eq(0).should('contain.text', 'Some notes')

    page
      .getAppointmentNotesRow()
      .find('.app-note')
      .eq(0)
      .find('p')
      .eq(1)
      .should('contain.text', 'Comment added by Terry Jones on 6 April 2023')

    page.getAppointmentNotesRow().find('.app-note').eq(1).find('p').eq(0).should('contain.text', 'Some more notes')

    page
      .getAppointmentNotesRow()
      .find('.app-note')
      .eq(1)
      .find('p')
      .eq(1)
      .should('contain.text', 'Comment added by Terry Jones on 7 April 2023')

    if (!deliusManaged) {
      page
        .getAppointmentNotesRow()
        .find('.govuk-summary-list__actions a')
        .should('contain.text', 'Add to notes')
        .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
    }
  })

  it('should display the correct values if no notes added to appointment', () => {
    let index = deliusManaged && hasOutcome ? 6 : 5
    if (enableNonCompliance && !deliusManaged) index += 1
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
    page.getAppointmentDetailsListItem(index, 'value').should('contain.text', 'No notes')
    if (!deliusManaged) {
      page
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change')
        .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
    }
  })

  if (hasOutcomeText) {
    it('should display the outcome text', () => {
      const index = deliusManaged && hasOutcome ? 8 : 7
      if (enableNonCompliance) {
        cy.task('stubEnableNonCompliance')
      }
      cy.task('stubAppointmentWithOutcomeText')
      cy.visit('/case/X778160/appointments/appointment/6/manage')
      page = new ManageAppointmentPage()
      page.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Outcome')
      page.getAppointmentDetailsListItem(index, 'value').should('contain.text', 'Recalled to custody')
      page.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
    })
  }
  it('should display sensitive', () => {
    const baseIndex = deliusManaged && hasOutcome ? 7 : 6
    let index = baseIndex + (hasOutcomeText ? 1 : 0)
    if (enableNonCompliance && !deliusManaged) index += 1
    if (enableNonCompliance) {
      cy.task('stubEnableNonCompliance')
    }
    cy.task('stubAppointment', { ...args })
    cy.visit('/case/X778160/appointments/appointment/6/manage')
    page = new ManageAppointmentPage()
    page.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Sensitive')
    page.getAppointmentDetailsListItem(index, 'value').should('contain.text', 'No')
    if (!deliusManaged) {
      page
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change')
        .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
    }
  })
}
