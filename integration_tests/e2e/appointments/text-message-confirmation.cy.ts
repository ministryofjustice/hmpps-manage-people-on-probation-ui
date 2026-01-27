import {
  completeLocationDateTimePage,
  completeSentencePage,
  completeTypePage,
  checkRiskToStaffAlert,
  checkPopHeader,
  uuid,
  normalise,
} from './imports'

import TextMessageConfirmationPage from '../../pages/appointments/text-message-confirmation.page'
import AppointmentNotePage from '../../pages/appointments/note.page'
import EditContactDetails from '../../pages/personalDetails/editContactDetails'

const crn = 'X000001'

const english = (location = 'Leamington') =>
  `Dear Stuart,<br><br>You have an appointment at ${location} Probation Office on Monday 11 August at 2pm.<br><br>This is an automated message. Do not reply.`
const welsh = `Annwyl Stuart,<br><br>Mae gennych apwyntiad yn Cardiff Probation Office ar Dydd Llun 11 Awst am 2pm.<br><br>Neges awtomataidd yw hon. Peidiwch ag ymateb.`

const loadPage = () => {
  cy.visit(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
  completeSentencePage(1, '', crn)
  completeTypePage()
  completeLocationDateTimePage({ crnOverride: crn })
}

describe('Text message confirmation', () => {
  let textMessageConfirmPage: TextMessageConfirmationPage
  let supportingInfoPage: AppointmentNotePage
  let editContactDetailsPage: EditContactDetails
  beforeEach(() => {
    cy.task('resetMocks')
  })
  describe('POP has mobile number', () => {
    beforeEach(() => {
      loadPage()
    })
    it('should render the page', () => {
      textMessageConfirmPage = new TextMessageConfirmationPage()
      textMessageConfirmPage.checkOnPage()
      checkPopHeader()
      checkRiskToStaffAlert(crn, 'Caroline', 'medium')
      textMessageConfirmPage
        .getSmsOptIn()
        .find('legend')
        .should('contain.text', 'Do you want to send Caroline a text message confirmation?')
      textMessageConfirmPage
        .getSmsOptIn()
        .find('.govuk-hint')
        .should('contain.text', 'Their mobile number is 07783889300.')
      textMessageConfirmPage.getSmsOptIn().find('.govuk-radios__item').should('have.length', 3)
      textMessageConfirmPage.getSmsOptIn().find('.govuk-radios__item').eq(0).find('label').should('contain.text', 'Yes')
      textMessageConfirmPage
        .getSmsOptIn()
        .find('.govuk-radios__item')
        .eq(1)
        .find('label')
        .should('contain.text', 'Yes, update their mobile number')
      textMessageConfirmPage.getSmsOptIn().find('.govuk-radios__item').eq(2).find('label').should('contain.text', 'No')
      textMessageConfirmPage.getSmsPreview().find('h3').should('contain.text', 'Text message preview')
      textMessageConfirmPage
        .getSmsPreview()
        .find('.govuk-hint')
        .should('contain.text', 'Preview the text that will be sent based on the appointment details.')
      textMessageConfirmPage.getSubmitBtn().should('contain.text', 'Continue')
    })
    it('should display the text message preview in english when the generate button is clicked if POP postcode is not welsh', () => {
      textMessageConfirmPage
        .getSmsPreview()
        .find('p')
        .eq(1)
        .should('contain.text', 'Caroline will receive this message:')

      textMessageConfirmPage
        .getSmsPreview()
        .find('.sms-message-wrapper p')
        .then($el => {
          expect(normalise($el.html())).to.include(english())
        })
    })

    it('should display validation summary and errors if Continue button is clicked without selecting an option', () => {
      textMessageConfirmPage.getSubmitBtn().click()
      textMessageConfirmPage.checkErrorSummaryBox(['Select if you want to send a text message confirmation'])
      textMessageConfirmPage
        .getElement(`#appointments-${crn}-${uuid}-smsOptIn-error`)
        .should('contain.text', 'Select if you want to send a text message confirmation')
    })
    it(`should redirect to the supporting information page if 'Yes' is selected`, () => {
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${crn}-${uuid}-smsOptIn`).click()
      textMessageConfirmPage.getSubmitBtn().click()
      supportingInfoPage = new AppointmentNotePage()
      supportingInfoPage.checkOnPage()
      supportingInfoPage.getBackLink().click()
      textMessageConfirmPage.checkOnPage()
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${crn}-${uuid}-smsOptIn`).should('be.checked')
    })
    it(`should redirect to the update contact details page if 'Yes, update mobile number' is selected`, () => {
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${crn}-${uuid}-smsOptIn-2`).click()
      textMessageConfirmPage.getSubmitBtn().click()
      editContactDetailsPage = new EditContactDetails()
      editContactDetailsPage.checkOnPage()
      editContactDetailsPage.getBackLink().click()
      textMessageConfirmPage.checkOnPage()
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${crn}-${uuid}-smsOptIn-2`).should('be.checked')
    })
    it(`should redirect to the supporting information page if 'No' is selected`, () => {
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${crn}-${uuid}-smsOptIn-3`).click()
      textMessageConfirmPage.getSubmitBtn().click()
      supportingInfoPage = new AppointmentNotePage()
      supportingInfoPage.checkOnPage()
      supportingInfoPage.getBackLink().click()
      textMessageConfirmPage.checkOnPage()
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${crn}-${uuid}-smsOptIn-3`).should('be.checked')
    })
  })
  describe('POP postcode area is in Wales', () => {
    beforeEach(() => {
      cy.task('stubPersonalDetailsWelshPostcode')
      loadPage()
    })
    it('should display the text message preview both in english and welsh', () => {
      textMessageConfirmPage
        .getSmsPreview()
        .find('p')
        .eq(1)
        .should(
          'contain.text',
          'Caroline’s preferred language is Welsh, so they will receive this message in English and in Welsh:',
        )
      textMessageConfirmPage
        .getSmsPreview()
        .find('.sms-message-wrapper')
        .eq(0)
        .find('p')
        .then($el => {
          expect(normalise($el.html())).to.include(english('Cardiff'))
        })
      textMessageConfirmPage
        .getSmsPreview()
        .find('.sms-message-wrapper')
        .eq(1)
        .find('p')
        .then($el => {
          expect(normalise($el.html())).to.include(welsh)
        })
    })
  })
  describe('POP does not have mobile number', () => {
    beforeEach(() => {
      cy.task('stubPersonalDetailsNoMobileNumber')
      loadPage()
    })
    it('should render the page', () => {
      textMessageConfirmPage = new TextMessageConfirmationPage()
      textMessageConfirmPage.checkOnPage()
      textMessageConfirmPage
        .getSmsOptIn()
        .find('.govuk-hint')
        .should('contain.text', 'They do not have a mobile number saved, you´ll need to check if they have one.')
      textMessageConfirmPage.getSmsOptIn().find('.govuk-radios__item').should('have.length', 2)
      textMessageConfirmPage
        .getSmsOptIn()
        .find('.govuk-radios__item')
        .eq(0)
        .find('label')
        .should('contain.text', 'Yes, add a mobile number')
      textMessageConfirmPage.getSmsOptIn().find('.govuk-radios__item').eq(1).find('label').should('contain.text', 'No')
    })
    it(`should redirect to the update contact details page if 'Yes, add a mobile number' is selected`, () => {
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${crn}-${uuid}-smsOptIn`).click()
      textMessageConfirmPage.getSubmitBtn().click()
      editContactDetailsPage = new EditContactDetails()
      editContactDetailsPage.checkOnPage()
      editContactDetailsPage.getBackLink().click()
      textMessageConfirmPage.checkOnPage()
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${crn}-${uuid}-smsOptIn`).should('be.checked')
    })
    it(`should redirect to the supporting information page if 'No' is selected`, () => {
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${crn}-${uuid}-smsOptIn-2`).click()
      textMessageConfirmPage.getSubmitBtn().click()
      supportingInfoPage = new AppointmentNotePage()
      supportingInfoPage.checkOnPage()
      supportingInfoPage.getBackLink().click()
      textMessageConfirmPage.checkOnPage()
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${crn}-${uuid}-smsOptIn-2`).should('be.checked')
    })
  })
})
