import { dateWithYear } from '../../../server/utils'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import AppointmentDateTimePage from '../../pages/appointments/date-time.page'
import AppointmentLocationNotInListPage from '../../pages/appointments/location-not-in-list.page'
import AppointmentLocationPage from '../../pages/appointments/location.page'
import AppointmentRepeatingPage from '../../pages/appointments/repeating.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import IndexPage from '../../pages'
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
  checkPopHeader,
} from './imports'
import { statusErrors } from '../../../server/properties'

const loadPage = (hasVisor = false, typeOptionIndex = 1, sentenceOptionIndex = 1) => {
  completeTypePage(typeOptionIndex, '', hasVisor)
  completeSentencePage(sentenceOptionIndex)
  completeAttendancePage()
  completeLocationPage()
  completeDateTimePage()
  completeRepeatingPage()
  completeNotePage()
}

describe('Check your answers then confirm the appointment', () => {
  beforeEach(() => {
    cy.task('resetMocks')
    loadPage()
  })
  it('should render the page', () => {
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
    cyaPage.getSummaryListRow(8).find('.govuk-summary-list__key').should('contain.text', 'Sensitivity')

    cyaPage.getSubmitBtn().should('include.text', 'Confirm this appointment')
  })

  it('should render the page with VISOR report', () => {
    const hasVisor = true
    it('should display the visor report answer', () => {
      cy.task('stubOverviewVisorRegistration')
      loadPage(hasVisor)
      const cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.getSummaryListRow(2).find('.govuk-summary-list__key').should('contain.text', 'VISOR report')
      cyaPage.getSummaryListRow(2).find('.govuk-summary-list__value').should('contain.text', 'Yes')
    })
  })

  it('should render the page with sentence and licence condition', () => {
    loadPage()
    cy.get('[data-qa="appointmentSentence"]').should('contain.text', '12 month Community order')
    cy.get('[data-qa="appointmentLicenceCondition"]').should(
      'contain.text',
      'Alcohol Monitoring (Electronic Monitoring)',
    )
    cy.get('[data-qa="appointmentRequirment"]').should('not.exist')
    cy.get('[data-qa="appointmentForename"]').should('not.exist')
  })

  it('should render the page with sentence and requirment', () => {
    const hasVisor = false
    const selectType = 1
    const selectSentence = 2
    loadPage(hasVisor, selectType, selectSentence)
    cy.get('[data-qa="appointmentSentence"]').should('contain.text', 'ORA Community Order')
    cy.get('[data-qa="appointmentRequirement"]').should('contain.text', '12 days RAR, 1 completed')
    cy.get('[data-qa="appointmentLicenceCondition"]').should('not.exist')
    cy.get('[data-qa="appointmentForename"]').should('not.exist')
  })

  it('should render the page with sentence and nsi', () => {
    const hasVisor = false
    const selectType = 1
    const selectSentence = 3
    loadPage(hasVisor, selectType, selectSentence)
    cy.get('[data-qa="appointmentSentence"]').should('contain.text', 'ORA Community Order')
    cy.get('[data-qa="appointmentNsi"]').should('contain.text', 'BRE description')
  })

  it('should render the page with personal contact', () => {
    const hasVisor = false
    const selectType = 5
    const selectSentence = 4
    loadPage(hasVisor, selectType, selectSentence)
    cy.get('[data-qa="appointmentForename"]').should('contain.text', 'Alton')
    cy.get('[data-qa="appointmentSentence"]').should('not.exist')
    cy.get('[data-qa="appointmentRequirement"]').should('not.exist')
    cy.get('[data-qa="appointmentLicenceCondition"]').should('not.exist')
  })

  describe('Change appointment values', () => {
    let cyaPage: AppointmentCheckYourAnswersPage
    let typePage: AppointmentTypePage
    let sentencePage: AppointmentSentencePage
    let dateTimePage: AppointmentDateTimePage
    let locationPage: AppointmentLocationPage
    let repeatingPage: AppointmentRepeatingPage
    let locationNotInListPage: AppointmentLocationNotInListPage
    beforeEach(() => {
      loadPage()
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
    it('should update the location by clicking on location not in list, then back link, then updating the value', () => {
      cyaPage.getSummaryListRow(4).find('.govuk-link').click()
      locationPage = new AppointmentLocationPage()
      locationPage.getRadio('locationCode', 4).click()
      locationPage.getSubmitBtn().click()
      locationNotInListPage = new AppointmentLocationNotInListPage()
      locationNotInListPage.getBackLink().click()
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
