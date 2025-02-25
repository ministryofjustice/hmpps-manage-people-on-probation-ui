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
      loadPage(type)
      sentencePage = new AppointmentSentencePage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence-2`).click()
    })
    if ([1, 4].includes(type)) {
      it('should display the requirement reveal', () => {
        sentencePage.getElement(`[data-qa="sentence-requirement"]`).should('be.visible')
        sentencePage.getElement('[data-qa="sentence-requirement"] legend').should($legend => {
          expect($legend.text().trim()).to.eq('Which requirement is this appointment for?')
        })
        sentencePage.getElement('[data-qa="sentence-requirement"] .govuk-hint').should($hint => {
          expect($hint.text().trim()).to.eq('Select requirement.')
        })
      })
      it('should display the error summary and error when continue is clicked without selecting a requirement', () => {
        loadPage(type)
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence-2`).click()
        sentencePage.getSubmitBtn().click()
        sentencePage.checkErrorSummaryBox(['Select a requirement'])

        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence-requirement-error`).should($error => {
          expect($error.text().trim()).to.include('Select a requirement')
        })
      })

      it('should persist the sentence selection', () => {
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence-2`).should('be.checked')
      })

      it('should focus the first radio button when the error summary link is clicked', () => {
        loadPage(type)
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence-2`).click()
        sentencePage.getSubmitBtn().click()
        sentencePage.getErrorSummaryLink(0).click()
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence-requirement`).should('be.focused')
      })

      it('should link to the location page when requirement is selected and continue is clicked', () => {
        loadPage(type)
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence-2`).click()
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence-requirement`).click()
        sentencePage.getSubmitBtn().click()
        const locationPage = new AppointmentLocationPage()
        locationPage.checkOnPage()
      })
    } else {
      it('should not display the requirement reveal', () => {
        sentencePage.getElement(`[data-qa="sentence-requirement"]`).should('not.exist')
      })
      it('should render the location page when continue is clicked', () => {
        sentencePage.getSubmitBtn().click()
        const locationPage = new AppointmentLocationPage()
        locationPage.checkOnPage()
      })
    }
  })
}

const checkLicenceConditionSentence = (type = 1) => {
  describe('Sentence with a licence condition is selected', () => {
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      loadPage(type)
      sentencePage = new AppointmentSentencePage()
      sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence`).click()
    })
    if ([1, 4].includes(type)) {
      it('should display the licence condition reveal', () => {
        sentencePage.getElement(`[data-qa="sentence-licence-condition"]`).should('be.visible')
        sentencePage.getElement('[data-qa="sentence-licence-condition"] legend').should($legend => {
          expect($legend.text().trim()).to.eq('Which licence condition is this appointment for?')
        })
        sentencePage.getElement('[data-qa="sentence-licence-condition"] .govuk-hint').should($hint => {
          expect($hint.text().trim()).to.eq('Select licence condition.')
        })
      })
      it('should display the error summary and error when continue is clicked without selecting a licence condition', () => {
        loadPage(type)
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence`).click()
        sentencePage.getSubmitBtn().click()
        sentencePage.checkErrorSummaryBox(['Select a licence condition'])
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence-licence-condition-error`).should($error => {
          expect($error.text().trim()).to.include('Select a licence condition')
        })
      })
      it('should persist the sentence selection', () => {
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence`).should('be.checked')
      })
      it('should focus the first radio button when the error summary link is clicked', () => {
        loadPage(type)
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence`).click()
        sentencePage.getSubmitBtn().click()
        sentencePage.getErrorSummaryLink(0).click()
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence-licence-condition`).should('be.focused')
      })
      it('should link to the location page when licence condition is selected and continue is clicked', () => {
        loadPage(type)
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence`).click()
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence-licence-condition`).click()
        sentencePage.getSubmitBtn().click()
        const locationPage = new AppointmentLocationPage()
        locationPage.checkOnPage()
      })
    } else {
      it('should not display the licence condition reveal', () => {
        sentencePage.getElement(`[data-qa="sentence-licence-condition"]`).should('not.exist')
      })
      it('should render the location page when continue is clicked', () => {
        sentencePage.getSubmitBtn().click()
        const locationPage = new AppointmentLocationPage()
        locationPage.checkOnPage()
      })
    }
  })
}

describe('Which sentence is this appointment for?', () => {
  describe('Page is rendered', () => {
    let sentencePage: AppointmentSentencePage
    beforeEach(() => {
      loadPage(1)
      sentencePage = new AppointmentSentencePage()
    })
    it('should display the hint text', () => {
      sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence-hint`).should($hint => {
        expect($hint.text().trim()).to.eq('Select sentence.')
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
      sentencePage.getElement(`[data-qa="sentence-licence-condition"]`).should('not.be.visible')
    })
    it('should not display the requirement options', () => {
      sentencePage.getElement(`[data-qa="sentence-requirement"]`).should('not.be.visible')
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
      sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence-error`).should($error => {
        expect($error.text().trim()).to.include('Select a sentence')
      })
    })
    describe('The error summary link is clicked', () => {
      beforeEach(() => {
        sentencePage.getErrorSummaryLink(0).click()
      })
      it('should focus the first radio button', () => {
        sentencePage.getElement(`#appointments-${crn}-${uuid}-sentence`).should('be.focused')
      })
    })
  })
  describe('Home visit appointment type is selected', () => {
    checkLicenceConditionSentence(1)
    checkRequirementSentence(1)
  })
  describe('Initial home visit appointment type is selected', () => {
    checkLicenceConditionSentence(2)
    checkRequirementSentence(2)
  })
  describe('Initial in office appointment type is selected', () => {
    checkLicenceConditionSentence(3)
    checkRequirementSentence(3)
  })
  describe('Planned office visit appointment type is selected', () => {
    checkLicenceConditionSentence(4)
    checkRequirementSentence(4)
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
      sentencePage.getElement(`[data-qa="sentence-licence-condition"]`).should('be.visible')
    })
  })
})
