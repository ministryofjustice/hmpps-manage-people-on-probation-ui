import { dateWithYear } from '../../../server/utils'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import AppointmentDateTimePage from '../../pages/appointments/date-time.page'
import AppointmentLocationPage from '../../pages/appointments/location.page'
import AppointmentNotePage from '../../pages/appointments/note.page'
import AppointmentRepeatingPage from '../../pages/appointments/repeating.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import {
  completeDateTimePage,
  completeLocationPage,
  completeRepeatingPage,
  completeSentencePage,
  completeTypePage,
  date,
  startTime,
  endTime,
  crn,
  uuid,
  completeAttendancePage,
  completeNotePage,
  checkAppointmentSummary,
} from './imports'

const loadPage = ({
  hasVisor = false,
  typeOptionIndex = 1,
  sentenceOptionIndex = 1,
  repeatAppointments = true,
  notes = true,
  sensitivity = true,
} = {}) => {
  completeTypePage(typeOptionIndex, '', hasVisor)
  completeSentencePage(sentenceOptionIndex)
  completeAttendancePage()
  completeLocationPage()
  completeDateTimePage()
  if (repeatAppointments) {
    completeRepeatingPage()
  }
  completeNotePage(notes, sensitivity)
}

describe('Check your answers then confirm the appointment', () => {
  beforeEach(() => {
    cy.task('resetMocks')
  })

  it('should render the page', () => {
    loadPage()
    const cyaPage = new AppointmentCheckYourAnswersPage()
    checkAppointmentSummary(cyaPage)
    cyaPage.getSubmitBtn().should('include.text', 'Confirm this appointment')
  })

  it('should render the page with VISOR report', () => {
    it('should display the visor report answer', () => {
      cy.task('stubOverviewVisorRegistration')
      loadPage({ hasVisor: true })
      const cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.getSummaryListRow(2).find('.govuk-summary-list__key').should('contain.text', 'VISOR report')
      cyaPage.getSummaryListRow(2).find('.govuk-summary-list__value').should('contain.text', 'Yes')
    })
  })

  it('should render the page with sentence and licence condition', () => {
    loadPage({})
    cy.get('[data-qa="appointmentSentence"]').should('contain.text', '12 month Community order')
    cy.get('[data-qa="appointmentLicenceCondition"]').should(
      'contain.text',
      'Alcohol Monitoring (Electronic Monitoring)',
    )
    cy.get('[data-qa="appointmentRequirment"]').should('not.exist')
    cy.get('[data-qa="appointmentForename"]').should('not.exist')
  })

  it('should render the page with sentence and requirment', () => {
    loadPage({ hasVisor: false, sentenceOptionIndex: 2 })
    cy.get('[data-qa="appointmentSentence"]').should('contain.text', 'ORA Community Order')
    cy.get('[data-qa="appointmentRequirement"]').should('contain.text', '12 days RAR, 1 completed')
    cy.get('[data-qa="appointmentLicenceCondition"]').should('not.exist')
    cy.get('[data-qa="appointmentForename"]').should('not.exist')
  })

  it('should render the page with sentence and nsi', () => {
    loadPage({ hasVisor: false, typeOptionIndex: 1, sentenceOptionIndex: 3 })
    cy.get('[data-qa="appointmentSentence"]').should('contain.text', 'ORA Community Order')
    cy.get('[data-qa="appointmentNsi"]').should('contain.text', 'BRE description')
  })

  it('should render the page with personal contact', () => {
    loadPage({ hasVisor: false, typeOptionIndex: 5, sentenceOptionIndex: 4 })
    cy.get('[data-qa="appointmentForename"]').should('contain.text', 'Alton')
    cy.get('[data-qa="appointmentSentence"]').should('not.exist')
    cy.get('[data-qa="appointmentRequirement"]').should('not.exist')
    cy.get('[data-qa="appointmentLicenceCondition"]').should('not.exist')
  })

  it('should render the page when repeating appointment featureflag is toggled off', () => {
    cy.task('stubNoRepeats')
    loadPage({ hasVisor: false, typeOptionIndex: 1, sentenceOptionIndex: 3, repeatAppointments: false })
    it('should not display the repeating appointment row', () => {
      cy.get('[data-qa="repeatingAppointmentLabel"]').should('not.exist')
      cy.get('[data-qa="repeatingAppointmentValue"]').should('not.exist')
    })
  })

  it('should render the page when no notes have been entered', () => {
    loadPage({ hasVisor: false, typeOptionIndex: 1, sentenceOptionIndex: 3, notes: false, sensitivity: false })
    const cyaPage = new AppointmentCheckYourAnswersPage()
    cyaPage.getSummaryListRow(7).find('.govuk-summary-list__value').should('contain.text', 'None')
  })

  describe('Change appointment values', () => {
    let cyaPage: AppointmentCheckYourAnswersPage
    let typePage: AppointmentTypePage
    let sentencePage: AppointmentSentencePage
    let dateTimePage: AppointmentDateTimePage
    let locationPage: AppointmentLocationPage
    let repeatingPage: AppointmentRepeatingPage
    let notePage: AppointmentNotePage
    beforeEach(() => {
      loadPage({})
      cyaPage = new AppointmentCheckYourAnswersPage()
    })
    it('should update the type when value is changed', () => {
      cyaPage.getSummaryListRow(1).find('.govuk-link').click()
      typePage = new AppointmentTypePage()
      typePage.getRadio('type', 2).click()
      typePage.getSubmitBtn().click()
      cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.checkOnPage()
      cyaPage.getSummaryListRow(1).find('.govuk-summary-list__value').should('contain.text', 'Home Visit to Case (NS)')
    })
    it('should update the sentence when value is changed', () => {
      cyaPage.getSummaryListRow(2).find('.govuk-link').click()
      sentencePage = new AppointmentSentencePage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId-2`).click()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-requirementId`).click()
      sentencePage.getSubmitBtn().click()
      cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.checkOnPage()
      cyaPage
        .getSummaryListRow(2)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'ORA Community Order')
        .should('contain.text', '12 days RAR, 1 completed')
    })
    it('should update the location when value is changed', () => {
      cyaPage.getSummaryListRow(4).find('.govuk-link').click()
      locationPage = new AppointmentLocationPage()
      locationPage.getRadio('locationCode', 2).click()
      locationPage.getSubmitBtn().click()
      cyaPage.getSummaryListRow(4).find('.govuk-summary-list__value').should('contain.text', '102 Petty France')
    })
    it('should update the date/time when value is changed', () => {
      const changedStart = '9:30am'
      const changedEnd = '10:30am'
      cyaPage.getSummaryListRow(5).find('.govuk-link').click()
      dateTimePage = new AppointmentDateTimePage()
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start`).select(changedStart)
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end`).focus().select(changedEnd).tab()
      dateTimePage.getSubmitBtn().click()
      // Ignore warnings
      dateTimePage.getSubmitBtn().click()
      cyaPage
        .getSummaryListRow(5)
        .find('.govuk-summary-list__value li:nth-child(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          expect(normalizedText).to.include(`${dateWithYear(date)} from ${changedStart} to ${changedEnd}`)
        })
    })
    it('should update the repeating appointment when value is changed', () => {
      cyaPage.getSummaryListRow(6).find('.govuk-link').click()
      repeatingPage = new AppointmentRepeatingPage()
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating-2`).click()
      repeatingPage.getSubmitBtn().click()
      cyaPage.getSummaryListRow(6).find('.govuk-summary-list__value').should('contain.text', 'No')
      cyaPage.getSummaryListRow(5).find('.govuk-summary-list__value li').should('have.length', 1)
      cyaPage
        .getSummaryListRow(5)
        .find('.govuk-summary-list__value li:nth-child(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          expect(normalizedText).to.include(`${dateWithYear(date)} from ${startTime} to ${endTime}`)
        })
    })
    it('should update the notes when value is changed', () => {
      cyaPage.getSummaryListRow(7).find('.govuk-link').click()
      const updatedNotes = 'Some updated notes'
      notePage = new AppointmentNotePage()
      notePage.getElement(`#notes`).focus().type(updatedNotes)
      notePage.getSubmitBtn().click()
      cyaPage.getSummaryListRow(7).find('.govuk-summary-list__value').should('contain.text', updatedNotes)
    })
    it('should update the sensitivity when value is changed', () => {
      cyaPage.getSummaryListRow(8).find('.govuk-link').click()
      notePage = new AppointmentNotePage()
      notePage.getElement(`#appointments-${crn}-${uuid}-sensitivity-2`).click()
      notePage.getSubmitBtn().click()
      cyaPage.getSummaryListRow(8).find('.govuk-summary-list__value').should('contain.text', 'No')
    })
  })
  describe('Confirm this appointment', () => {
    let cyaPage: AppointmentCheckYourAnswersPage
    beforeEach(() => {
      loadPage()
      cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.getSubmitBtn().click()
    })
    it('should submit the appointment and redirect to the confirmation page', () => {
      const confirmPage = new AppointmentConfirmationPage()
      confirmPage.checkOnPage()
    })
  })
})
