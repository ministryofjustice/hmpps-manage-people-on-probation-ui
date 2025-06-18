import AppointmentLocationPage from '../../pages/appointments/location.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import { crn, uuid, completeTypePage } from './imports'

const loadPage = (type = 1, query = '') => {
  completeTypePage(type, query)
}

const checkRequirementSentence = (type = 1) => {
  describe('Sentence with a requirement is clicked', () => {
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      loadPage()
      sentencePage = new AppointmentSentencePage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId-2`).click()
    })
    it('should display the requirement reveal', () => {
      sentencePage.getElement(`[data-qa="requirementId"]`).should('be.visible')
      sentencePage.getElement('[data-qa="requirementId"] legend').should($legend => {
        expect($legend.text().trim()).to.eq('Which requirement is this appointment for? (optional)')
      })
    })
    it('should not display the licence condition reveal', () => {
      sentencePage.getElement(`[data-qa="licenceConditionId"]`).should('not.be.visible')
    })
    it('should link to the location page when requirement is selected and continue is clicked', () => {
      loadPage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId-2`).click()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-requirementId`).click()
      sentencePage.getSubmitBtn().click()
      const locationPage = new AppointmentLocationPage()
      locationPage.checkOnPage()
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
    it('should not display the requirement reveal', () => {
      sentencePage.getElement(`[data-qa="requirementId"]`).should('not.be.visible')
    })
    it('should link to the location page when licence condition is selected and continue is clicked', () => {
      loadPage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId`).click()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-licenceConditionId`).click()
      sentencePage.getSubmitBtn().click()
      const locationPage = new AppointmentLocationPage()
      locationPage.checkOnPage()
    })
  })
}

describe('What is this appointment for?', () => {
  describe('Page is rendered', () => {
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      loadPage(1)
      sentencePage = new AppointmentSentencePage()
    })
    it('should display the hint text', () => {
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId-hint`).should($hint => {
        expect($hint.text().trim()).to.eq('Select all that apply.')
      })
    })
    it('should display 2 sentences that are not selected', () => {
      const radios = sentencePage.getElement(`input[data-sentence="true"]`)
      radios.should('have.length', 2)
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

  describe('Back link is clicked', () => {
    let typePage: AppointmentTypePage
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      loadPage()
      sentencePage = new AppointmentSentencePage()
      sentencePage.getBackLink().click()
      typePage = new AppointmentTypePage()
    })
    it('should be on the type page', () => {
      typePage.checkOnPage()
    })
    it('should persist the type selection', () => {
      typePage.getRadio('type', 1).should('be.checked')
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
      sentencePage.checkErrorSummaryBox(['Select a sentence'])
    })

    it('should display the error message', () => {
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId-error`).should($error => {
        expect($error.text().trim()).to.include('Select a sentence')
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
      loadPage(5)
      sentencePage = new AppointmentSentencePage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId`).click()
    })
    it('should display the personal contact option', () => {
      cy.get('[data-qa="personLevelContactLabel"]').should('contain.text', 'Alton')
    })
    it('should link to the location page when the contact option is selected and continue is clicked', () => {
      loadPage(5)
      sentencePage.getElement(`#appointments-${crn}-${uuid}-eventId-3`).click()
      sentencePage.getSubmitBtn().click()
      const locationPage = new AppointmentLocationPage()
      locationPage.checkOnPage()
    })
  })
  describe('Page is rendered for a single sentence with licence condition', () => {
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      loadPage(1, '?number=1')
      sentencePage = new AppointmentSentencePage()
    })
    it('should display 1 sentence that is selected', () => {
      const radios = sentencePage.getElement(`input[data-sentence="true"]`)
      radios.should('have.length', 1)
      radios.each($radio => {
        cy.wrap($radio).should('be.checked')
      })
    })
    it('should display the licence condition reveal', () => {
      sentencePage.getElement(`[data-qa="licenceConditionId"]`).should('be.visible')
    })
  })
})
