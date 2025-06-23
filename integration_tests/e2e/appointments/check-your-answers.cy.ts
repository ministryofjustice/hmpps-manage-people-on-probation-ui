import { dateWithYear } from '../../../server/utils'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import AppointmentDateTimePage from '../../pages/appointments/date-time.page'
import AppointmentLocationPage from '../../pages/appointments/location.page'
import AppointmentRepeatingPage from '../../pages/appointments/repeating.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import {
  completeDateTimePage,
  completeLocationPage,
  completePreviewPage,
  completeRepeatingPage,
  completeSentencePage,
  completeTypePage,
  date,
  startTime,
  endTime,
  crn,
  uuid,
  completeAttendancePage,
} from './imports'

const regex: RegExp = /^\d{1,2}\s[A-Za-z]+ \d{4}\sfrom\s\d{1,2}:\d{2}[ap]m\sto\s\d{1,2}:\d{2}[ap]m$/

const loadPage = () => {
  completeTypePage()
  completeSentencePage()
  completeAttendancePage()
  completeLocationPage()
  completeDateTimePage()
  completeRepeatingPage()
  completePreviewPage()
}

describe('Check your answers then confirm the appointment', () => {
  beforeEach(() => {
    loadPage()
  })
  it('should render the page', () => {
    const cyaPage = new AppointmentCheckYourAnswersPage()
    cyaPage.getSummaryListRow(1).find('.govuk-summary-list__key').should('contain.text', 'Appointment type')
    cyaPage.getSummaryListRow(1).find('.govuk-summary-list__value').should('contain.text', '3 Way Meeting (NS)')
    cyaPage.getSummaryListRow(2).find('.govuk-summary-list__key').should('contain.text', 'Sentence')
    cyaPage.getSummaryListRow(2).find('.govuk-summary-list__value').should('contain.text', '12 month Community order')
    cyaPage
      .getSummaryListRow(2)
      .find('.govuk-summary-list__value')
      .should('contain.text', 'Alcohol Monitoring (Electronic Monitoring)')
    cyaPage.getSummaryListRow(3).find('.govuk-summary-list__key').should('contain.text', 'Location')
    cyaPage.getSummaryListRow(3).find('.govuk-summary-list__value').should('contain.text', 'HMP Wakefield')
    cyaPage.getSummaryListRow(4).find('.govuk-summary-list__key').should('contain.text', 'Date and time')
    // cyaPage
    //   .getSummaryListRow(4)
    //   .find('.govuk-summary-list__value li:nth-child(1)')
    //   .should('contain.text', `${dateWithYear(date)} from ${startTime} to ${endTime}`)
    cyaPage.getSummaryListRow(4).find('.govuk-summary-list__value li:nth-child(2)').contains(regex)
    cyaPage.getSummaryListRow(4).find('.govuk-summary-list__value li:nth-child(3)').contains(regex)
    cyaPage.getSummaryListRow(5).find('.govuk-summary-list__key').should('contain.text', 'Repeating appointment')
    cyaPage.getSummaryListRow(5).find('.govuk-summary-list__value').should('contain.text', 'Yes')
    cyaPage.getSubmitBtn().should('include.text', 'Confirm this appointment')
  })

  describe('Change appointment values', () => {
    let cyaPage: AppointmentCheckYourAnswersPage
    let typePage: AppointmentTypePage
    let sentencePage: AppointmentSentencePage
    let dateTimePage: AppointmentDateTimePage
    let locationPage: AppointmentLocationPage
    let repeatingPage: AppointmentRepeatingPage
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
      cyaPage.getSummaryListRow(3).find('.govuk-link').click()
      locationPage = new AppointmentLocationPage()
      locationPage.getRadio('locationCode', 2).click()
      locationPage.getSubmitBtn().click()
      cyaPage.getSummaryListRow(3).find('.govuk-summary-list__value').should('contain.text', '102 Petty France')
    })
    it('should update the date/time when value is changed', () => {
      const changedStart = '9:30am'
      const changedEnd = '10:30am'
      cyaPage.getSummaryListRow(4).find('.govuk-link').click()
      dateTimePage = new AppointmentDateTimePage()
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-start`).select(changedStart)
      dateTimePage.getElement(`#appointments-${crn}-${uuid}-end`).focus().select(changedEnd).tab()
      dateTimePage.getSubmitBtn().click()
      // Ignore warnings
      dateTimePage.getSubmitBtn().click()
      cyaPage
        .getSummaryListRow(4)
        .find('.govuk-summary-list__value li:nth-child(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          expect(normalizedText).to.include(`${dateWithYear(date)} from ${changedStart} to ${changedEnd}`)
        })
    })
    it('should update the repeating appointment when value is changed', () => {
      cyaPage.getSummaryListRow(5).find('.govuk-link').click()
      repeatingPage = new AppointmentRepeatingPage()
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating-2`).click()
      repeatingPage.getSubmitBtn().click()
      cyaPage.getSummaryListRow(5).find('.govuk-summary-list__value').should('contain.text', 'No')
      cyaPage.getSummaryListRow(4).find('.govuk-summary-list__value li').should('have.length', 1)
      cyaPage
        .getSummaryListRow(4)
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
})
