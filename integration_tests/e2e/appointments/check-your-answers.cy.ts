import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import IndexPage from '../../pages'

import {
  completeDateTimePage,
  completeLocationPage,
  completeRepeatingPage,
  completeSentencePage,
  completeTypePage,
  completeAttendancePage,
  completeNotePage,
  checkPopHeader,
  checkAppointmentSummary,
  checkUpdateDateTime,
  checkUpdateLocation,
  checkUpdateNotes,
  checkUpdateRepeating,
  checkUpdateSensitivity,
  checkUpdateSentence,
  checkUpdateType,
} from './imports'
import { statusErrors } from '../../../server/properties'

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
    checkPopHeader('Alton Berge', true)
    cyaPage.getSummaryListRow(1).find('.govuk-summary-list__key').should('contain.text', 'Appointment type')
    cyaPage.getSummaryListRow(1).find('.govuk-summary-list__value').should('contain.text', '3 Way Meeting (NS)')
    cyaPage.getSummaryListRow(2).find('.govuk-summary-list__key').should('not.have.text', 'VISOR report')
    cyaPage.getSummaryListRow(2).find('.govuk-summary-list__key').should('contain.text', 'Appointment for')
    cyaPage.getSummaryListRow(2).find('.govuk-summary-list__value').should('contain.text', '12 month Community order')
    cyaPage
      .getSummaryListRow(2)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Alcohol Monitoring (Electronic Monitoring)')
    cyaPage.getSummaryListRow(3).find('.govuk-summary-list__key').should('contain.text', 'Attending')
    cyaPage
      .getSummaryListRow(3)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'peter parker (PS-PSO)')
      .should('contain.text', '(A P Central Admissions Unit, Greater Manchester)')
    cyaPage.getSummaryListRow(4).find('.govuk-summary-list__key').should('contain.text', 'Location')
    cyaPage
      .getSummaryListRow(4)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'HMP Wakefield')
      .should('contain.text', 'Love Lane')
      .should('contain.text', 'Wakefield')
      .should('contain.text', 'West Yorkshire')
      .should('contain.text', 'WF2 9AG')
    cyaPage.getSummaryListRow(5).find('.govuk-summary-list__key').should('contain.text', 'Date and time')
    cyaPage
      .getSummaryListRow(5)
      .find('.govuk-summary-list__value li:nth-child(1)')
      .invoke('text')
      .then(text => {
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        expect(normalizedText).to.include(`${dateWithYear(date)} from ${startTime} to ${endTime}`)
      })
    cyaPage.getSummaryListRow(6).find('.govuk-summary-list__key').should('contain.text', 'Repeating appointment')
    cyaPage.getSummaryListRow(6).find('.govuk-summary-list__value').should('contain.text', 'Yes')
    cyaPage.getSummaryListRow(7).find('.govuk-summary-list__key').should('contain.text', 'Appointment notes')
    cyaPage.getSummaryListRow(7).find('.govuk-summary-list__value').should('contain.text', 'Some notes')
    cyaPage.getSummaryListRow(8).find('.govuk-summary-list__key').should('contain.text', 'Sensitivity')
    cyaPage.getSummaryListRow(8).find('.govuk-summary-list__value').should('contain.text', 'Yes')
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
    beforeEach(() => {
      loadPage()
      cyaPage = new AppointmentCheckYourAnswersPage()
    })
    it('should update the type when value is changed', () => {
      checkUpdateType(cyaPage)
    })
    it('should update the sentence when value is changed', () => {
      checkUpdateSentence(cyaPage)
    })
    it('should update the location when value is changed', () => {
      checkUpdateLocation(cyaPage)
    })
    it('should update the date when value is changed', () => {
      checkUpdateDateTime(cyaPage)
    })
    it('should update the repeat appointment when value is changed', () => {
      checkUpdateRepeating(cyaPage)
    })
    it('should update the notes when value is changed', () => {
      checkUpdateNotes(cyaPage)
    })
    it('should update the sensitivity when value is changed', () => {
      checkUpdateSensitivity(cyaPage)
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
  describe('Duplicate appointment', () => {
    let cyaPage: AppointmentCheckYourAnswersPage
    beforeEach(() => {
      cy.task('stubAppointmentDuplicate')
      loadPage()
      cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.getSubmitBtn().click()
    })
    it('should render the 409 error page', () => {
      cy.get('h1').should('contain.text', statusErrors[409].title)
      cy.get('[data-qa="errorMessage"]').should('contain.text', 'Go to the Manage people on probation homepage')
      cy.get('[data-qa="homepageLink"]').click()
      const homepage = new IndexPage()
      homepage.checkOnPage()
    })
  })
})
