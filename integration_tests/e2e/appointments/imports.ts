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

export const crn = 'X778160'
export const uuid = '19a88188-6013-43a7-bb4d-6e338516818f'
export const date = DateTime.now().plus({ days: 1 }).toISODate()
export const startTime = '9:00am'
export const endTime = '10:00am'
export const dateRegex: RegExp =
  /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) \d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/

export const getUuid = () => {
  return cy.url().then(currentUrl => {
    const split = currentUrl.split('?')[0].split('/')
    return split[split.length - 2]
  })
}

export const completeTypePage = (index = 1, query = '', hasVisor = false) => {
  cy.visit(`/case/${crn}/arrange-appointment/${uuid}/type${query}`, { failOnStatusCode: false })
  const typePage = new AppointmentTypePage()
  typePage.getRadio('type', index).click()
  if (hasVisor) {
    typePage.getRadio('visorReport', index).click()
  }
  typePage.getSubmitBtn().click()
}

export const completeSentencePage = (eventIndex = 1) => {
  const sentencePage = new AppointmentSentencePage()
  const suffix = eventIndex !== 1 ? `-${eventIndex}` : ''
  sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId${suffix}`).click()
  if (eventIndex === 1) {
    sentencePage.getElement(`#appointments-${crn}-${uuid}-licenceConditionId`).click()
  }
  if (eventIndex === 2) {
    sentencePage.getElement(`#appointments-${crn}-${uuid}-requirementId`).click()
  }
  if (eventIndex === 3) {
    sentencePage.getElement(`#appointments-${crn}-${uuid}-nsiId`).click()
  }
  sentencePage.getSubmitBtn().click()
}

export const completeAttendancePage = () => {
  const attendancePage = new AttendancePage()
  attendancePage.getSubmitBtn().click()
}

export const completeLocationPage = (index = 1) => {
  const suffix = index > 1 ? `-${index}` : ''
  const locationPage = new AppointmentLocationPage()
  locationPage.getElement(`#appointments-${crn}-${uuid}-user-locationCode${suffix}`).click()
  locationPage.getSubmitBtn().click()
}

export const completeDateTimePage = () => {
  const dateTimePage = new AppointmentDateTimePage()
  dateTimePage.getDatePickerToggle().click()
  dateTimePage.getNextDayButton().click()
  dateTimePage.getElement(`#appointments-${crn}-${uuid}-start`).select(startTime)
  dateTimePage.getElement(`#appointments-${crn}-${uuid}-end`).focus().select(endTime).tab()
  dateTimePage.getSubmitBtn().click()
  // Ignore warnings on second click
  dateTimePage.getSubmitBtn().click()
}

export const completeNotePage = (notes = true) => {
  const notePage = new AppointmentNotePage()
  cy.get('form').then(form => form[0].reset())
  if (notes) {
    notePage.getElement(`#notes`).focus().type('Some notes')
  }
  notePage.getElement(`#appointments-${crn}-${uuid}-sensitivity`).click()
  notePage.getSubmitBtn().click()
}

export const completeRepeatingPage = (repeat = 2) => {
  const repeatingPage = new AppointmentRepeatingPage()
  if (repeat) {
    repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating`).click()
    repeatingPage.getElement(`#appointments-${crn}-${uuid}-interval`).click()
    repeatingPage.getElement(`#appointments-${crn}-${uuid}-numberOfRepeatAppointments`).clear().type(repeat.toString())
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

export const checkAppointmentUpdate = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  let typePage: AppointmentTypePage
  let sentencePage: AppointmentSentencePage
  let dateTimePage: AppointmentDateTimePage
  let locationPage: AppointmentLocationPage
  let repeatingPage: AppointmentRepeatingPage
  let notePage: AppointmentNotePage

  it('should update the type when value is changed', () => {
    page.getSummaryListRow(1).find('.govuk-link').click()
    typePage = new AppointmentTypePage()
    typePage.getRadio('type', 2).click()
    typePage.getSubmitBtn().click()
    page.checkOnPage()
    page.getSummaryListRow(1).find('.govuk-summary-list__value').should('contain.text', 'Home Visit to Case (NS)')
  })
  it('should update the sentence when value is changed', () => {
    page.getSummaryListRow(2).find('.govuk-link').click()
    sentencePage = new AppointmentSentencePage()
    sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId-2`).click()
    sentencePage.getElement(`#appointments-${crn}-${uuid}-requirementId`).click()
    sentencePage.getSubmitBtn().click()
    page.checkOnPage()
    page
      .getSummaryListRow(2)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'ORA Community Order')
      .should('contain.text', '12 days RAR, 1 completed')
  })
  it('should update the location when value is changed', () => {
    page.getSummaryListRow(4).find('.govuk-link').click()
    locationPage = new AppointmentLocationPage()
    locationPage.getRadio('locationCode', 2).click()
    locationPage.getSubmitBtn().click()
    page.checkOnPage()
    page.getSummaryListRow(4).find('.govuk-summary-list__value').should('contain.text', '102 Petty France')
  })
  it('should update the date/time when value is changed', () => {
    const changedStart = '9:30am'
    const changedEnd = '10:30am'
    page.getSummaryListRow(5).find('.govuk-link').click()
    dateTimePage = new AppointmentDateTimePage()
    dateTimePage.getElement(`#appointments-${crn}-${uuid}-start`).select(changedStart)
    dateTimePage.getElement(`#appointments-${crn}-${uuid}-end`).focus().select(changedEnd).tab()
    dateTimePage.getSubmitBtn().click()
    // Ignore warnings
    dateTimePage.getSubmitBtn().click()
    page.checkOnPage()
    page
      .getSummaryListRow(5)
      .find('.govuk-summary-list__value li:nth-child(1)')
      .invoke('text')
      .then(text => {
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        expect(normalizedText).to.include(`${dateWithYear(date)} from ${changedStart} to ${changedEnd}`)
      })
  })
  it('should update the repeating appointment when value is changed', () => {
    page.getSummaryListRow(6).find('.govuk-link').click()
    repeatingPage = new AppointmentRepeatingPage()
    repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating-2`).click()
    repeatingPage.getSubmitBtn().click()
    page.checkOnPage()
    page.getSummaryListRow(6).find('.govuk-summary-list__value').should('contain.text', 'No')
    page.getSummaryListRow(5).find('.govuk-summary-list__value li').should('have.length', 1)
    page
      .getSummaryListRow(5)
      .find('.govuk-summary-list__value li:nth-child(1)')
      .invoke('text')
      .then(text => {
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        expect(normalizedText).to.include(`${dateWithYear(date)} from ${startTime} to ${endTime}`)
      })
  })
  it('should update the notes when value is changed', () => {
    page.getSummaryListRow(7).find('.govuk-link').click()
    const updatedNotes = 'Some updated notes'
    notePage = new AppointmentNotePage()
    notePage.getElement(`#notes`).focus().type(updatedNotes)
    notePage.getSubmitBtn().click()
    page.checkOnPage()
    page.getSummaryListRow(7).find('.govuk-summary-list__value').should('contain.text', updatedNotes)
  })
  it('should update the sensitivity when value is changed', () => {
    page.getSummaryListRow(8).find('.govuk-link').click()
    notePage = new AppointmentNotePage()
    notePage.getElement(`#appointments-${crn}-${uuid}-sensitivity-2`).click()
    notePage.getSubmitBtn().click()
    page.checkOnPage()
    page.getSummaryListRow(8).find('.govuk-summary-list__value').should('contain.text', 'No')
  })
}
