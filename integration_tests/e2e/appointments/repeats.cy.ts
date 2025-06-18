import 'cypress-plugin-tab'
import AppointmentRepeatingPage from '../../pages/appointments/repeating.page'
import AppointmentPreviewPage from '../../pages/appointments/preview.page'

import {
  crn,
  uuid,
  completeTypePage,
  completeSentencePage,
  completeLocationPage,
  completeDateTimePage,
} from './imports'

const loadPage = () => {
  completeTypePage()
  completeSentencePage()
  completeLocationPage()
  completeDateTimePage()
}

describe('Will the appointment repeat?', () => {
  let repeatingPage: AppointmentRepeatingPage
  beforeEach(() => {
    loadPage()
    repeatingPage = new AppointmentRepeatingPage()
  })
  it('should be on the repeating page', () => {
    repeatingPage.checkOnPage()
  })
  it('should display the error summary box', () => {
    repeatingPage.getSubmitBtn().click()
    repeatingPage.checkErrorSummaryBox(['Select if the appointment will repeat'])
  })
  describe('Continue is clicked without selecting a repeat option', () => {
    beforeEach(() => {
      loadPage()
      repeatingPage = new AppointmentRepeatingPage()
      repeatingPage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      repeatingPage.checkErrorSummaryBox(['Select if the appointment will repeat'])
    })
    it('should display the error message', () => {
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating-error`).should($error => {
        expect($error.text().trim()).to.include('Select if the appointment will repeat')
      })
    })
  })
  describe('The error summary link is clicked', () => {
    beforeEach(() => {
      loadPage()
      repeatingPage = new AppointmentRepeatingPage()
      repeatingPage.getSubmitBtn().click()
      repeatingPage.getErrorSummaryLink(0).click()
    })
    it('should focus the first radio button', () => {
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating`).should('be.focused')
    })
  })
  describe('Yes is selected', () => {
    beforeEach(() => {
      loadPage()
      repeatingPage = new AppointmentRepeatingPage()
    })
    it('should display the repeat frequency and count reveal', () => {
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating`).click()
      repeatingPage.getElement(`#conditional-appointments-${crn}-${uuid}-repeating`).should('be.visible')
    })
  })
  describe('No is selected', () => {
    beforeEach(() => {
      loadPage()
      repeatingPage = new AppointmentRepeatingPage()
    })
    after(() => {
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating`).click()
    })
    it('should hide the repeat frequency and count reveal', () => {
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating-2`).click()
      repeatingPage.getElement(`#conditional-appointments-${crn}-${uuid}-repeating`).should('not.be.visible')
    })
  })
  describe('Continue is clicked without selecting a repeat frequency or count', () => {
    beforeEach(() => {
      loadPage()
      repeatingPage = new AppointmentRepeatingPage()
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating`).click()
      repeatingPage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      repeatingPage.checkErrorSummaryBox([
        'Select the frequency the appointment will repeat',
        'Enter the number of times the appointment will repeat',
      ])
    })
    it('should display the error messages', () => {
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-interval-error`).should($error => {
        expect($error.text().trim()).to.include('Select the frequency the appointment will repeat')
      })
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-numberOfAppointments-error`).should($error => {
        expect($error.text().trim()).to.include('Enter the number of times the appointment will repeat')
      })
    })
    it('should focus the first frequency radio button when the first error summary link is clicked', () => {
      repeatingPage.getErrorSummaryLink(0).click()
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-interval`).should('be.focused')
    })
    it('should focus the count field when the second error summary link is clicked', () => {
      repeatingPage.getErrorSummaryLink(1).click()
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-numberOfAppointments`).should('be.focused')
    })
  })
  describe('Weekly frequency is selected, the continue is clicked', () => {
    beforeEach(() => {
      loadPage()
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating`).click()
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-interval`).click()
      repeatingPage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      repeatingPage.checkErrorSummaryBox(['Enter the number of times the appointment will repeat'])
    })
  })
  describe('An invalid repeat count in entered', () => {
    beforeEach(() => {
      loadPage()
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating`).click()
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-interval`).click()
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-numberOfAppointments`).type('xx')
      repeatingPage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      repeatingPage.checkErrorSummaryBox(['Enter a number'])
    })
  })
  describe('Valid count is entered', () => {
    beforeEach(() => {
      loadPage()
      cy.intercept(
        'GET',
        `http://localhost:3007/case/${crn}/arrange-appointment/${uuid}/repeating?interval=WEEK&numberOfAppointments=4`,
        {
          statusCode: 200,
          body: `<!DOCTYPE html>
<html lang="en" class="govuk-template">
  <head>
   </head>
  <body class="govuk-template__body">
  <div class="form-group" data-last-appointment>     
  <h3 class="govuk-heading-s govuk-!-font-weight-regular govuk-!-static-margin-bottom-0 govuk-hint">Last appointment on</h3>
   <p><b>Thursday 13 February 2025</b></p>
</div>
</body>
</html>`,
        },
      )
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-repeating`).click()
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-interval`).click()
      repeatingPage.getElement(`#appointments-${crn}-${uuid}-numberOfAppointments`).type('4')
    })
    it('Should display the last appointment date', () => {
      repeatingPage.getLastAppointment().should('be.visible')
      repeatingPage.getLastAppointmentHeading().should('include.text', 'Last appointment on')
      repeatingPage.getLastAppointmentDate().should('include.text', 'Thursday 13 February 2025')
    })
    it('should redirect to the appointment confirmation page when continue is clicked', () => {
      repeatingPage.getSubmitBtn().click()
      const previewPage = new AppointmentPreviewPage()
      previewPage.checkOnPage()
    })
  })
})
