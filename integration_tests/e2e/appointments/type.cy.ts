import Page from '../../pages/page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import { appointmentTypes } from '../../../server/properties'
import 'cypress-plugin-tab'
import mockResponse from '../../../wiremock/mappings/appointment-types.json'
import { AppointmentType } from '../../../server/models/Appointments'
import { getWiremockData, Wiremock } from '../../utils'

const mockData = mockResponse as Wiremock

const mockAppointmentTypes = getWiremockData<AppointmentType[]>(mockData, '/mas/appointment/types', 'appointmentTypes')
const crn = 'X778160'
const uuid = '19a88188-6013-43a7-bb4d-6e338516818f'

const loadPage = () => {
  cy.visit(`/case/${crn}/arrange-appointment/${uuid}/type`)
}

describe('Arrange an appointment', () => {
  let typePage: AppointmentTypePage
  let sentencePage: AppointmentSentencePage
  afterEach(() => {
    cy.task('resetMocks')
  })
  describe('What appointment are you arranging?', () => {
    describe('No VISOR registration', () => {
      it('should render the page', () => {
        loadPage()
        typePage = Page.verifyOnPage(AppointmentTypePage)
        typePage.getBackLink().should($backLink => {
          expect($backLink.text()).to.eq('Back')
        })
        typePage.getBackLink().should('have.attr', 'href', '/')
        cy.get('[data-qa="type"] legend').should('contain.text', 'What appointment are you arranging?')
        for (let i = 1; i < mockAppointmentTypes.length; i += 1) {
          typePage.getRadioLabel('type', i).should('contain.text', mockAppointmentTypes[i - 1].description)
          typePage.getRadio('type', i).should('not.be.checked')
        }

        cy.get('[data-qa="visorReport"]').should('not.exist')
        typePage.getSubmitBtn().should('contain.text', 'Continue')
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
            typePage.getErrorSummaryLink(0).click()
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
    describe('VISOR registration', () => {
      it('should render the page', () => {
        cy.task('stubOverviewVisorRegistration')
        loadPage()
        cy.get('[data-qa="visorReport"] legend').should('contain.text', 'Include appointment in VISOR report?')
        cy.get('[data-qa="visorReport"] .govuk-hint').should(
          'contain.text',
          'This will add the appointment to their record on the ViSOR secure national database.',
        )
        const options = ['Yes', 'No']
        for (let i = 1; i < options.length; i += 1) {
          typePage.getRadioLabel('visorReport', i).should('contain.text', options[i - 1])
          typePage.getRadio('visorReport', i).should('not.be.checked')
        }
      })
      describe('Continue is clicked without first selecting a type or visor', () => {
        beforeEach(() => {
          cy.task('stubOverviewVisorRegistration')
          loadPage()
          typePage.getSubmitBtn().click()
        })
        it('should display the error summary box', () => {
          typePage.checkErrorSummaryBox([
            'Select an appointment type',
            'Select if appointment should be included in ViSOR report',
          ])
        })

        it('should display the error messages', () => {
          typePage.getElement(`#appointments-${crn}-${uuid}-type-error`).should($error => {
            expect($error.text().trim()).to.include('Select an appointment type')
          })
          typePage.getElement(`#appointments-${crn}-${uuid}-visorReport-error`).should($error => {
            expect($error.text().trim()).to.include('Select if appointment should be included in ViSOR report')
          })
        })
        describe('The error summary link is clicked', () => {
          beforeEach(() => {
            typePage.getErrorSummaryLink(0).click()
          })
          it('should focus the first radio button', () => {
            typePage.getRadio('type', 1).should('be.focused')
          })
        })
        describe('Type and VISOR are selected, and continue is clicked', () => {
          beforeEach(() => {
            loadPage()
            typePage.getElement(`#appointments-${crn}-${uuid}-type`).click()
            typePage.getElement(`#appointments-${crn}-${uuid}-visorReport`).click()
            typePage.getSubmitBtn().click()
          })
          it('should redirect to the sentence page', () => {
            sentencePage = new AppointmentSentencePage()
            sentencePage.checkOnPage()
          })
        })
      })
    })
  })
})
