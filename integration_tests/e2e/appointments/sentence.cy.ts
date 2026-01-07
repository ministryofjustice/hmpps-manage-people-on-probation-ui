import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import { crn, uuid, checkPopHeader } from './imports'

const loadPage = () => {
  cy.visit(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
}

describe('What is this appointment for?', () => {
  describe('Page is rendered', () => {
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      loadPage()
      sentencePage = new AppointmentSentencePage()
    })
    it('should display 4 sentences that are not selected', () => {
      const radios = sentencePage.getElement(`input[data-sentence="true"]`)
      radios.should('have.length', 4)
      radios.each($radio => {
        cy.wrap($radio).should('not.be.checked')
      })
    })
  })
  describe('Continue is clicked without selecting a sentence', () => {
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      loadPage()
      sentencePage = new AppointmentSentencePage()
      sentencePage.getSubmitBtn().click()
    })
    it('should display the error summary box', () => {
      sentencePage.checkErrorSummaryBox(['Select what this appointment is for'])
    })

    it('should display the error message', () => {
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId-error`).should($error => {
        expect($error.text().trim()).to.include('Select what this appointment is for')
      })
    })
    describe('The error summary link is clicked', () => {
      beforeEach(() => {
        sentencePage.getErrorSummaryLink(0).click()
      })
      it('should focus the first radio button', () => {
        sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId`).should('be.focused')
      })
    })
  })

  describe('Sentence with no requirement or licence condition is selected', () => {})
  describe('Personal contact is selected', () => {
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      loadPage()
      sentencePage = new AppointmentSentencePage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId`).click()
    })
    it('should display the personal contact option', () => {
      cy.get('[data-qa="personLevelContactLabel"]').should('contain.text', 'Alton')
    })
    it('should link to the type page when the contact option is selected and continue is clicked', () => {
      loadPage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId-3`).click()
      sentencePage.getSubmitBtn().click()
      const typePage = new AppointmentTypePage()
      typePage.checkOnPage()
    })
  })
})
