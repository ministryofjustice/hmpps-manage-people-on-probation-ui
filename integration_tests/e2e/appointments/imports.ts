import 'cypress-plugin-tab'
import { DateTime } from 'luxon'
import AppointmentDateTimePage from '../../pages/appointments/date-time.page'
import AppointmentLocationPage from '../../pages/appointments/location.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import AppointmentRepeatingPage from '../../pages/appointments/repeating.page'
import AppointmentPreviewPage from '../../pages/appointments/preview.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AttendancePage from '../../pages/appointments/attendance.page'
import AppointmentNotePage from '../../pages/appointments/note.page'
import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
import { dateWithYear } from '../../../server/utils'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'

export const crn = 'X778160'
export const uuid = '19a88188-6013-43a7-bb4d-6e338516818f'
export const date = DateTime.now().plus({ days: 1 }).toISODate()
export const startTime = '9:00am'
export const endTime = '10:00am'
export const dateRegex: RegExp =
  /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) \d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/

interface Args {
  hasOutcome?: boolean
  deliusManagedType?: boolean
  notCompliedAbsence?: boolean
  hasComplied?: boolean
  task?: string
  withNotesTask?: string
  noNotesTask?: string
}

export const getUuid = () => {
  return cy.url().then(currentUrl => {
    const split = currentUrl.split('?')[0].split('/')
    return split[split.length - 2]
  })
}

export const completeTypePage = (
  index = 1,
  query = '',
  hasVisor = false,
  crnOverride = '',
  dateOverride?: DateTime<true>,
) => {
  const tomorrow = DateTime.now().plus({ days: 1 }).set({
    hour: 9,
    minute: 30,
    second: 0,
    millisecond: 0,
  })
  const setDate = dateOverride ?? tomorrow
  cy.clock(setDate.toMillis())
  cy.visit(`/case/${crnOverride || crn}/arrange-appointment/${uuid}/type${query}`, { failOnStatusCode: false })
  const typePage = new AppointmentTypePage()
  typePage.getRadio('type', index).click()
  if (hasVisor) {
    typePage.getRadio('visorReport', index).click()
  }
  typePage.getSubmitBtn().click()
}

export const completeSentencePage = (eventIndex = 1, crnOverride = '') => {
  const sentencePage = new AppointmentSentencePage()
  const suffix = eventIndex !== 1 ? `-${eventIndex}` : ''
  sentencePage.getElement(`#appointments-${crnOverride || crn}-${uuid}-eventId${suffix}`).click()
  if (eventIndex === 1 && !crnOverride) {
    sentencePage.getElement(`#appointments-${crnOverride || crn}-${uuid}-licenceConditionId`).click()
  }
  if (eventIndex === 2 && !crnOverride) {
    sentencePage.getElement(`#appointments-${crnOverride || crn}-${uuid}-requirementId`).click()
  }
  if (eventIndex === 3 && !crnOverride) {
    sentencePage.getElement(`#appointments-${crnOverride || crn}-${uuid}-nsiId`).click()
  }
  sentencePage.getSubmitBtn().click()
}

export const completeAttendancePage = () => {
  const attendancePage = new AttendancePage()
  attendancePage.getSubmitBtn().click()
}

export const completeLocationPage = (index = 1, crnOverride = '') => {
  const suffix = index > 1 ? `-${index}` : ''
  const locationPage = new AppointmentLocationPage()
  locationPage.getElement(`#appointments-${crnOverride || crn}-${uuid}-user-locationCode${suffix}`).click()
  locationPage.getSubmitBtn().click()
}

export const completeDateTimePage = (crnOverride = '') => {
  const dateTimePage = new AppointmentDateTimePage()

  dateTimePage.getDatePickerToggle().click()
  dateTimePage.getActiveDayButton().click()
  dateTimePage.getElement(`#appointments-${crnOverride || crn}-${uuid}-start`).select(startTime)
  dateTimePage
    .getElement(`#appointments-${crnOverride || crn}-${uuid}-end`)
    .focus()
    .select(endTime)
  // Ignore warnings on second click
  dateTimePage.getSubmitBtn().click()
  dateTimePage.getSubmitBtn().click()
}

export const completeNotePage = (notes = true, crnOverride = '') => {
  const notePage = new AppointmentNotePage()
  cy.get('form').then(form => form[0].reset())
  if (notes) {
    notePage.getElement(`#notes`).focus().type('Some notes')
  }
  notePage.getElement(`#appointments-${crnOverride || crn}-${uuid}-sensitivity`).click()
  notePage.getSubmitBtn().click()
}

export const completeRepeatingPage = (repeat = 2, crnOverride = '') => {
  const repeatingPage = new AppointmentRepeatingPage()
  if (repeat) {
    repeatingPage.getElement(`#appointments-${crnOverride || crn}-${uuid}-repeating`).click()
    repeatingPage.getElement(`#appointments-${crnOverride || crn}-${uuid}-interval`).click()
    repeatingPage
      .getElement(`#appointments-${crnOverride || crn}-${uuid}-numberOfRepeatAppointments`)
      .clear()
      .type(repeat.toString())
  } else {
    repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating-2`).click()
  }
  repeatingPage.getSubmitBtn().click()
}

export const completePreviewPage = () => {
  const previewPage = new AppointmentPreviewPage()
  previewPage.getSubmitBtn().click()
}
export const completeCYAPage = () => {
  const cyaPage = new AppointmentCheckYourAnswersPage()
  cyaPage.getSubmitBtn().click()
}
export const checkPopHeader = (name = 'Caroline Wolff', appointments = false) => {
  cy.get('h1').should('contain.text', name)
  cy.get('[data-qa="crn"]').should('contain.text', 'X000001')
  cy.get('[data-qa="headerDateOfBirthValue"]').should('contain.text', '18 August 1979')
  cy.get('[data-qa="headerDateOfBirthAge"]').should('contain.text', '45')
  cy.get('[data-qa="tierValue"]').should('contain.text', appointments ? 'A3' : 'B2')
  cy.get('.predictor-timeline-item').eq(0).find('.predictor-timeline-item__level').should('contain.text', 'ROSH')
  cy.get('.predictor-timeline-item')
    .eq(0)
    .find('.predictor-timeline-item__level')
    .should('contain.text', appointments ? 'HIGH' : 'VERY HIGH')
  if (!appointments) {
    cy.get('.predictor-timeline-item').eq(1).find('.predictor-timeline-item__level').should('contain.text', 'RSR')
    cy.get('.predictor-timeline-item').eq(1).find('.predictor-timeline-item__level').should('contain.text', 'MEDIUM')
    cy.get('.predictor-timeline-item').eq(1).find('.predictor-timeline-item__score').should('contain.text', '12.1')
  }
}

export const completeConfirmationPage = () => {
  const confirmationPage = new AppointmentConfirmationPage()
  confirmationPage.getSubmitBtn().click()
}

export const checkAppointmentSummary = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  page.getSummaryListRow(1).find('.govuk-summary-list__key').should('contain.text', 'Appointment type')
  page.getSummaryListRow(1).find('.govuk-summary-list__value').should('contain.text', '3 Way Meeting (NS)')
  page.getSummaryListRow(2).find('.govuk-summary-list__key').should('not.have.text', 'VISOR report')
  page.getSummaryListRow(2).find('.govuk-summary-list__key').should('contain.text', 'Appointment for')
  page.getSummaryListRow(2).find('.govuk-summary-list__value').should('contain.text', '12 month Community order')
  page
    .getSummaryListRow(2)
    .find('.govuk-summary-list__value')
    .should('contain.text', 'Alcohol Monitoring (Electronic Monitoring)')
  page.getSummaryListRow(3).find('.govuk-summary-list__key').should('contain.text', 'Attending')
  page
    .getSummaryListRow(3)
    .find('.govuk-summary-list__value')
    .should('contain.text', 'peter parker (PS-PSO)')
    .should('contain.text', '(Automated Allocation Team, London)')
  page.getSummaryListRow(4).find('.govuk-summary-list__key').should('contain.text', 'Location')
  page
    .getSummaryListRow(4)
    .find('.govuk-summary-list__value')
    .should('contain.text', 'HMP Wakefield')
    .should('contain.text', 'Love Lane')
    .should('contain.text', 'Wakefield')
    .should('contain.text', 'West Yorkshire')
    .should('contain.text', 'WF2 9AG')
  page.getSummaryListRow(5).find('.govuk-summary-list__key').should('contain.text', 'Date and time')
  if (page instanceof AppointmentCheckYourAnswersPage) {
    page
      .getSummaryListRow(5)
      .find('.govuk-summary-list__value li:nth-child(1)')
      .invoke('text')
      .then(text => {
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        expect(normalizedText).to.include(`${dateWithYear(date)} from ${startTime} to ${endTime}`)
      })
  }
  if (page instanceof ArrangeAnotherAppointmentPage) {
    page.getSummaryListRow(5).find('.govuk-summary-list__value').should('contain.text', 'Not entered')
  }

  page.getSummaryListRow(6).find('.govuk-summary-list__key').should('contain.text', 'Repeating appointment')
  page
    .getSummaryListRow(6)
    .find('.govuk-summary-list__value')
    .should('contain.text', page instanceof ArrangeAnotherAppointmentPage ? 'No' : 'Yes')
  page.getSummaryListRow(7).find('.govuk-summary-list__key').should('contain.text', 'Appointment notes')
  page.getSummaryListRow(7).find('.govuk-summary-list__value').should('contain.text', 'Some notes')
  page.getSummaryListRow(8).find('.govuk-summary-list__key').should('contain.text', 'Sensitivity')
  page.getSummaryListRow(8).find('.govuk-summary-list__value').should('contain.text', 'Yes')
}

export const checkUpdateType = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  page.getSummaryListRow(1).find('.govuk-link').click()
  const typePage = new AppointmentTypePage()
  typePage.getRadio('type', 2).click()
  typePage.getSubmitBtn().click()
  page.getSummaryListRow(1).find('.govuk-summary-list__value').should('contain.text', 'Home Visit to Case (NS)')
}

export const checkUpdateSentence = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  getUuid().then(pageUuid => {
    page.getSummaryListRow(2).find('.govuk-link').click()
    const sentencePage = new AppointmentSentencePage()
    sentencePage.getElement(`#appointments-${crn}-${pageUuid}-eventId-2`).click()
    sentencePage.getElement(`#appointments-${crn}-${pageUuid}-requirementId`).click()
    sentencePage.getSubmitBtn().click()
    page.checkOnPage()
    page
      .getSummaryListRow(2)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'ORA Community Order')
      .should('contain.text', '12 days RAR, 1 completed')
  })
}

export const checkUpdateLocation = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  page.getSummaryListRow(4).find('.govuk-link').click()
  const locationPage = new AppointmentLocationPage()
  locationPage.getRadio('locationCode', 2).click()
  locationPage.getSubmitBtn().click()
  page.checkOnPage()
  page.getSummaryListRow(4).find('.govuk-summary-list__value').should('contain.text', '102 Petty France')
}

export const checkUpdateDateTime = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  getUuid().then(pageUuid => {
    const newDate = DateTime.now().plus({ days: 2 }).set({
      hour: 7,
      minute: 30,
      second: 0,
      millisecond: 0,
    })
    const changedStart = '9:30am'
    const changedEnd = '10:30am'
    page.getSummaryListRow(5).find('.govuk-link').click()
    const dateTimePage = new AppointmentDateTimePage()
    dateTimePage.getDatePickerToggle().click()
    cy.get(`[data-testid="${newDate.day}/${newDate.month}/${newDate.year}"]`).click()
    dateTimePage.getElement(`#appointments-${crn}-${pageUuid}-start`).select(changedStart)
    dateTimePage.getElement(`#appointments-${crn}-${pageUuid}-end`).focus().select(changedEnd)
    // Ignore warnings
    dateTimePage.getSubmitBtn().click()
    dateTimePage.getSubmitBtn().click()
    page.checkOnPage()

    page
      .getSummaryListRow(5)
      .find('.govuk-summary-list__value li:nth-child(1)')
      .invoke('text')
      .then(text => {
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        expect(normalizedText).to.include(`${dateWithYear(newDate.toISODate())} from ${changedStart} to ${changedEnd}`)
      })
  })
}

export const checkUpdateRepeating = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  getUuid().then(pageUuid => {
    page.getSummaryListRow(6).find('.govuk-link').click()
    const repeatingPage = new AppointmentRepeatingPage()
    repeatingPage.getElement(`#appointments-${crn}-${pageUuid}-repeating-2`).click()
    repeatingPage.getSubmitBtn().click()
    page.checkOnPage()
    page.getSummaryListRow(6).find('.govuk-summary-list__value').should('contain.text', 'No')
    if (page instanceof AppointmentCheckYourAnswersPage) {
      page.getSummaryListRow(5).find('.govuk-summary-list__value li').should('have.length', 1)
      page
        .getSummaryListRow(5)
        .find('.govuk-summary-list__value li:nth-child(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          expect(normalizedText).to.include(`${dateWithYear(date)} from ${startTime} to ${endTime}`)
        })
    }
  })
}

export const checkUpdateNotes = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  page.getSummaryListRow(7).find('.govuk-link').click()
  const updatedNotes = 'Some updated notes'
  const notePage = new AppointmentNotePage()
  notePage.getElement(`#notes`).focus().clear().type(updatedNotes)
  notePage.getSubmitBtn().click()
  page.checkOnPage()
  page.getSummaryListRow(7).find('.govuk-summary-list__value').should('contain.text', updatedNotes)
}

export const checkUpdateSensitivity = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  getUuid().then(pageUuid => {
    page.getSummaryListRow(8).find('.govuk-link').click()
    const notePage = new AppointmentNotePage()
    notePage.getElement(`#appointments-${crn}-${pageUuid}-sensitivity-2`).click()
    notePage.getSubmitBtn().click()
    page.checkOnPage()
    page.getSummaryListRow(8).find('.govuk-summary-list__value').should('contain.text', 'No')
  })
}

export const checkAppointmentDetails = (
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
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
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
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
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
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
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
      cy.visit('/case/X778160/appointments/appointment/6/manage')
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
      cy.visit('/case/X778160/appointments/appointment/6/manage')
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
      cy.visit('/case/X778160/appointments/appointment/6/manage')
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
    cy.visit('/case/X778160/appointments/appointment/6/manage')
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
