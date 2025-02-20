import Page from '../../pages/page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import { appointmentTypes } from '../../../server/properties'
import 'cypress-plugin-tab'

const crn = 'X778160'
const uuid = '19a88188-6013-43a7-bb4d-6e338516818f'

const loadPage = () => {
  cy.visit(`/case/${crn}/arrange-appointment/${uuid}/type`)
}

describe('Arrange an appointment', () => {
  let typePage: AppointmentTypePage
  let sentencePage: AppointmentSentencePage
  describe('What appointment are you arranging?', () => {
    beforeEach(() => {
      loadPage()
      typePage = Page.verifyOnPage(AppointmentTypePage)
    })
    it('Page is rendered', () => {
      typePage.getBackLink().should($backLink => {
        expect($backLink.text()).to.eq('Back')
      })
      typePage.getBackLink().should('have.attr', 'href', '/')
      for (let i = 1; i < appointmentTypes.length; i += 1) {
        typePage.getRadioLabel('type', i).should('contain.text', appointmentTypes[i - 1].text)
        typePage.getRadio('type', i).should('not.be.checked')
      }
      typePage.getSubmitBtn().should('contain.text', 'Continue')
    })
  })
  describe('Continue is clicked without first selecting a type', () => {
    beforeEach(() => {
      loadPage()
      typePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      typePage.checkErrorSummaryBox(['Select an appointment type'])
    })

    it('should display the error message', () => {
      typePage.getElement(`#appointments-${crn}-${uuid}-type-error`).should($error => {
        expect($error.text().trim()).to.include('Select an appointment type')
      })
    })
    describe('The error summary link is clicked', () => {
      beforeEach(() => {
        typePage.getErrorSummaryLink(1).click()
      })
      it('should focus the first radio button', () => {
        typePage.getRadio('type', 1).should('be.focused')
      })
    })
  })
  describe('Type is selected, and continue is clicked', () => {
    beforeEach(() => {
      loadPage()
      typePage.getElement(`#appointments-${crn}-${uuid}-type`).click()
      typePage.getSubmitBtn().click()
    })
    it('should redirect to the sentence page', () => {
      sentencePage = new AppointmentSentencePage()
      sentencePage.checkOnPage()
    })
  })
})
