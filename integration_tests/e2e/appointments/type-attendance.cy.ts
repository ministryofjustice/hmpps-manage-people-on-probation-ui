import Page from '../../pages/page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import 'cypress-plugin-tab'
import mockResponse from '../../../wiremock/mappings/appointment-types.json'
import { AppointmentType } from '../../../server/models/Appointments'
import { getWiremockData, Wiremock } from '../../utils'
import {
  checkPopHeader,
  checkRiskToStaffAlert,
  completeLocationDateTimePage,
  completeSentencePage,
  completeSupportingInformationPage,
  completeTextMessageConfirmationPage,
  completeTypePage,
} from './imports'
import { toSentenceCase } from '../../../server/utils'
import AttendancePage from '../../pages/appointments/attendance.page'
import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'

const mockData = mockResponse as Wiremock

const mockAppointmentTypes = getWiremockData<AppointmentType[]>(mockData, '/mas/appointment/types', 'appointmentTypes')
const crn = 'X778160'
const uuid = '19a88188-6013-43a7-bb4d-6e338516818f'

const loadPage = () => {
  cy.visit(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
  completeSentencePage()
}

describe('Arrange an appointment', () => {
  let typePage: AppointmentTypePage
  let attendancePage: AttendancePage
  let locationPage: AppointmentLocationDateTimePage
  beforeEach(() => {
    cy.task('resetMocks')
  })
  describe('What appointment are you arranging?', () => {
    describe('No VISOR registration', () => {
      it('should render the page', () => {
        loadPage()
        checkPopHeader('Alton Berge', true, 'X778160')
        // checkRiskToStaffAlert()
        typePage = Page.verifyOnPage(AppointmentTypePage)
        typePage.getBackLink().should($backLink => {
          expect($backLink.text()).to.eq('Back')
        })
        typePage.getBackLink().should('have.attr', 'href', `/case/${crn}/arrange-appointment/${uuid}/sentence`)
        cy.get('[data-qa="type"] legend').should('contain.text', 'What appointment are you arranging?')
        for (let i = 1; i < mockAppointmentTypes.length; i += 1) {
          typePage
            .getRadioLabel('type', i)
            .should('contain.text', toSentenceCase(mockAppointmentTypes[i - 1].description))
          typePage.getRadio('type', i).should('not.be.checked')
        }
        cy.get('[data-qa="attendee"] h2').should('contain.text', 'Who will attend the appointment?')
        cy.get('[data-qa="attendee"] p:nth-of-type(1)').should(
          'contain.text',
          'You can attend or book for someone else',
        )
        cy.get('[data-qa="attendeeDetails"]').should(
          'contain.text',
          'Deborah Fern (PS - Other) (Automated Allocation Team, London)',
        )
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
          typePage.getRadio('type', 2).click()
          typePage.getSubmitBtn().click()
        })
        it('should redirect to the location page', () => {
          locationPage = new AppointmentLocationDateTimePage()
          locationPage.checkOnPage()
        })
      })
    })
    describe('VISOR registration', () => {
      it('should render the page', () => {
        cy.task('stubOverviewVisorRegistration')
        loadPage()
        cy.get('[data-qa="visorReport"] legend').should('contain.text', 'Include appointment in ViSOR report?')
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
            typePage.getRadio('type', 2).click()
            typePage.getElement(`#appointments-${crn}-${uuid}-visorReport`).click()
            typePage.getSubmitBtn().click()
          })
          it('should redirect to the location page', () => {
            locationPage = new AppointmentLocationDateTimePage()
            locationPage.checkOnPage()
          })
        })
      })
    })
    describe('Back link is clicked', () => {
      let sentencePage: AppointmentSentencePage
      beforeEach(() => {
        loadPage()
        typePage = new AppointmentTypePage()
        typePage.getBackLink().click()
        sentencePage = new AppointmentSentencePage()
      })
      it('should be on the sentence page', () => {
        sentencePage.checkOnPage()
      })
      it('should persist the sentence selection', () => {
        sentencePage.getRadio('sentences', 1).should('be.checked')
      })
    })
    describe('Person level contact was selected', () => {
      beforeEach(() => {
        cy.visit(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
        completeSentencePage(4)
        typePage = new AppointmentTypePage()
      })
      it('should have limited set of appointmentTypes', () => {
        cy.get(`[data-qa="type"] .govuk-radios__item`).find('input').should('have.length', 2)
      })
      it('should keep limited set even after error', () => {
        typePage.getSubmitBtn().click()
        cy.get(`[data-qa="type"] .govuk-radios__item`).find('input').should('have.length', 2)
      })
    })
  })

  describe('Changing the probation practitioner attendee back to default user', () => {
    const expectedUser = 'Peter Parker (PS-PSO) (Automated Allocation Team, London)'
    beforeEach(() => {
      loadPage()
      typePage = new AppointmentTypePage()
    })
    it('should render the attendee page with the default user selected', () => {
      typePage.getRadio('type', 2).click()
      cy.get('[data-qa="attendee"] a').click()
      attendancePage = new AttendancePage()
      attendancePage.checkOnPage()
      cy.get('[data-qa="providerCode"]').should('have.value', 'N07')
      cy.get('[data-qa="teamCode"]').should('have.value', 'N07AAT')
      cy.get('[data-qa="username"]').should('have.value', 'peter-parker')
      attendancePage.getSubmitBtn().click()
      typePage = new AppointmentTypePage()
      typePage.checkOnPage()
      typePage.getRadio('type', 2).should('be.checked')
      cy.get('[data-qa="attendeeDetails').should('contain.text', expectedUser)
      typePage.getRadio('type', 2).click()
      typePage.getSubmitBtn().click()
      locationPage.getBackLink().click()
      cy.get('[data-qa="attendeeDetails').should('contain.text', expectedUser)
    })
    it('backlink should return to type-attendee page', () => {
      loadPage()
      cy.get('[data-qa="attendee"] a').click()
      attendancePage = new AttendancePage()
      attendancePage.getBackLink().click()
      typePage.checkOnPage()
    })
  })

  describe('Probation practitioner not allocated', () => {
    beforeEach(() => {
      cy.task('stubNoAllocatedCOM')
      loadPage()
    })
    it('should list the default user as the attendee', () => {
      cy.get('[data-qa="attendeeDetails"]').should(
        'contain.text',
        'Peter Parker (PS-PSO) (Automated Allocation Team, London)',
      )
    })
    it('should update the default user', () => {
      const changedUser = 'Iain Chambers (PS - Other) (Homelessness Prevention Team,, North East Region)'
      cy.get('[data-qa="attendee"] a').click()
      cy.get('[data-qa="providerCode"]').should('have.value', 'N07')
      cy.get('[data-qa="teamCode"]').should('have.value', 'N07AAT')
      cy.get('[data-qa="username"]').should('have.value', 'peter-parker')
      cy.get('[data-qa="providerCode"]').select('N54')
      cy.get('[data-qa="teamCode"]').select('N07HPT')
      cy.get('[data-qa="username"]').select('IainChambers')
      attendancePage.getSubmitBtn().click()
      cy.get('[data-qa="attendeeDetails"]').should('contain.text', changedUser)
      completeTypePage()
      completeLocationDateTimePage()
      completeTextMessageConfirmationPage({ index: 1 })
      completeSupportingInformationPage()
      const cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.getSummaryListRow(3).find('.govuk-summary-list__value').should('contain.text', changedUser)
      cyaPage.getSummaryListRow(3).find('.govuk-link').click()
      cy.get('[data-qa="providerCode"]').should('have.value', 'N54')
      cy.get('[data-qa="teamCode"]').should('have.value', 'N07HPT')
      cy.get('[data-qa="username"]').should('have.value', 'IainChambers')
      cy.get('[data-qa="providerCode"]').select('N07')
      cy.get('[data-qa="teamCode"]').select('N07AAT')
      cy.get('[data-qa="username"]').select('peter-parker')
      attendancePage.getSubmitBtn().click()
      cyaPage
        .getSummaryListRow(3)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'Peter Parker (PS-PSO) (Automated Allocation Team, London)')
    })
  })
})
