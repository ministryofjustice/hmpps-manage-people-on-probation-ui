import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import { crn, uuid, checkPopHeader } from './imports'

const loadPage = () => {
  cy.visit(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
}

const checkRequirementSentence = (type = 1) => {
  describe('Sentence with a requirement is clicked', () => {
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      loadPage()
      checkPopHeader('Alton Berge', true)
      sentencePage = new AppointmentSentencePage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId-2`).click()
    })
    it('should display the requirement reveal', () => {
      sentencePage.getElement(`[data-qa="requirementId"]`).should('be.visible')
      sentencePage.getElement('[data-qa="requirementId"] legend').should($legend => {
        expect($legend.text().trim()).to.eq('Which requirement is this appointment for? (optional)')
      })
    })
    it('should display the terminated requirements', () => {
      const radios = sentencePage.getElement(`[data-qa="requirementId"]`).find('.govuk-radios__item')
      radios.should('have.length', 3)
      radios.eq(2).find(`.govuk-hint`).should('contain.text', 'Terminated')
    })
    it('should not display the licence condition reveal', () => {
      sentencePage.getElement(`[data-qa="licenceConditionId"]`).should('not.be.visible')
    })
    it('should link to the type page when requirement is selected and continue is clicked', () => {
      loadPage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId-2`).click()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-requirementId`).click()
      sentencePage.getSubmitBtn().click()
      const typePage = new AppointmentTypePage()
      typePage.checkOnPage()
    })
  })
}

const checkLicenceConditionSentence = (type = 1) => {
  describe('Sentence with a licence condition is selected', () => {
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      loadPage()
      sentencePage = new AppointmentSentencePage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId`).click()
    })
    it('should display the licence condition reveal', () => {
      sentencePage.getElement(`[data-qa="licenceConditionId"]`).should('be.visible')
      sentencePage.getElement('[data-qa="licenceConditionId"] legend').should($legend => {
        expect($legend.text().trim()).to.eq('Which licence condition is this appointment for? (optional)')
      })
    })
    it('should display the terminated licence conditions', () => {
      const radios = sentencePage.getElement(`[data-qa="licenceConditionId"]`).find('.govuk-radios__item')
      radios.should('have.length', 4)
      radios.eq(3).find(`.govuk-hint`).should('contain.text', 'Terminated')
    })
    it('should not display the requirement reveal', () => {
      sentencePage.getElement(`[data-qa="requirementId"]`).should('not.be.visible')
    })
    it('should link to the type page when licence condition is selected and continue is clicked', () => {
      loadPage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId`).click()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-licenceConditionId`).click()
      sentencePage.getSubmitBtn().click()
      const typePage = new AppointmentTypePage()
      typePage.checkOnPage()
    })
  })
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
    it('should not display the licence condition options', () => {
      sentencePage.getElement(`[data-qa="licenceConditionId"]`).should('not.be.visible')
    })
    it('should not display the requirement options', () => {
      sentencePage.getElement(`[data-qa="requirementId"]`).should('not.be.visible')
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
  describe('Sentence with requirement is selected', () => {
    checkRequirementSentence()
  })
  describe('Sentence with licence condition is selected', () => {
    checkLicenceConditionSentence()
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
