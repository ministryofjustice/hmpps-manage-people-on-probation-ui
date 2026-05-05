import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import { checkPopHeader, checkRiskToStaffAlert } from './imports'
import { crn, uuid } from './imports/common'
import { PageElement } from '../../pages/page'

const loadPage = (_crn = crn) => {
  cy.visit(`/case/${_crn}/arrange-appointment/${uuid}/sentence`)
}

describe('What is this appointment for?', () => {
  describe('Page is rendered', () => {
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      cy.task('stubSentences', { crn: 'X778160' })
      loadPage()
      sentencePage = new AppointmentSentencePage()
    })
    it('should render the pop header', () => {
      checkPopHeader({ name: 'Alton Berge', appointments: true, headerCrn: 'X778160' })
    })
    it('should display 4 sentences that are not selected', () => {
      const radios = sentencePage.getElement(`input[data-sentence="true"]`)
      radios.should('have.length', 3)
      radios.each($radio => {
        cy.wrap($radio).should('not.be.checked')
      })
    })
    it('should return to the previous page when back button is clicked', () => {
      loadPage()
      sentencePage = new AppointmentSentencePage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId`).click()
      sentencePage.getSubmitBtn().click()
      sentencePage.getBackLink().click()
      cy.url().should('contain', `/case/X778160/arrange-appointment/${uuid}/sentence`)
    })
  })
  describe('Risk to staff alert', () => {
    beforeEach(() => {
      loadPage('X000001')
    })
    it('should display the alert with medium risk to staff details', () => {
      checkRiskToStaffAlert('X000001', 'Caroline', 'medium')
    })
  })
  describe('Continue is clicked without selecting a sentence', () => {
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      loadPage()
      sentencePage = new AppointmentSentencePage()
      sentencePage.getSubmitBtn().click()
    })
    it('should display the error summary box and error', () => {
      sentencePage.checkErrorSummaryBox(['Select what this appointment is for'])
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
    it('should link to the type page when the contact option is selected and continue is clicked', () => {
      loadPage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId-3`).click()
      sentencePage.getSubmitBtn().click()
      const typePage = new AppointmentTypePage()
      typePage.checkOnPage()
    })
  })

  describe('POP has one Sentence', () => {
    beforeEach(() => {
      cy.task('stubSingleSentence', { crn: 'X778160' })
      cy.visit(`/case/X778160/arrange-appointment/${uuid}/sentence`)
    })

    it('should redirect to the type-attendance page and select the only sentence available', () => {
      cy.url().should('contain', `/case/X778160/arrange-appointment/${uuid}/type-attendance`)
      cy.get('[data-qa="pageHeading"]').should('have.text', 'Appointment type and attendance')
    })

    it('should redirect to the appointments page when back button is clicked', () => {
      cy.url().should('contain', `/case/X778160/arrange-appointment/${uuid}/type-attendance`)
      cy.get('[data-qa="pageHeading"]').should('have.text', 'Appointment type and attendance')

      const backButton = (): PageElement => cy.get('.govuk-back-link')
      backButton().click()

      cy.url().should('contain', `/case/X778160/appointments`)
    })
  })
})
