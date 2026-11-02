import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import { checkPopHeader } from './imports'
import { crn, uuid } from './imports/common'

const loadPage = (_crn = crn) => {
  cy.visit(`/case/${_crn}/arrange-appointment/${uuid}/sentence`)
}

describe('What is this appointment for?', () => {
  describe('POP has multiple sentences', () => {
    it('should validate the selection, continue to the type page and return to the sentence page', () => {
      cy.task('stubSentences', { crn })
      loadPage()
      const sentencePage = new AppointmentSentencePage()

      // page is rendered
      checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: crn })

      // continue without selecting a sentence, then use the error summary link
      sentencePage.getSubmitBtn().click()
      sentencePage.getErrorSummaryLink(0).click()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId`).should('be.focused')

      // select a sentence, continue, then go back
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId`).click()
      sentencePage.getSubmitBtn().click()
      const typePage = new AppointmentTypePage()
      typePage.checkOnPage()
      typePage.getBackLink().click()
      cy.url().should('contain', `/case/${crn}/arrange-appointment/${uuid}/sentence`)

      // select the personal contact option and continue
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId-3`).click()
      sentencePage.getSubmitBtn().click()
      new AppointmentTypePage().checkOnPage()
    })
  })

  describe('POP has one sentence', () => {
    it('should redirect to the type-attendance page, then to the appointments page when back is clicked', () => {
      cy.task('stubSingleSentence', { crn })
      loadPage()
      cy.url().should('contain', `/case/${crn}/arrange-appointment/${uuid}/type-attendance`)
      cy.get('[data-qa="pageHeading"]').should('have.text', 'Appointment type and attendance')

      new AppointmentTypePage().getBackLink().click()
      cy.url().should('contain', `/case/${crn}/appointments`)
    })
  })
})
