import AppointmentTypePage from '../../pages/appointments/type.page'
import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'
import { completeSentencePage } from './utils'
// import AttendancePage from '../../pages/appointments/attendance.page'

const crn = 'X778160'
const uuid = '19a88188-6013-43a7-bb4d-6e338516818g'

const loadPage = (_crn = crn) => {
  cy.visit(`/case/${_crn}/arrange-appointment/${uuid}/sentence`)
  completeSentencePage({ eventIndex: 1, crnOverride: _crn })
}

describe('Arrange an appointment', () => {
  let typePage: AppointmentTypePage
  let locationPage: AppointmentLocationDateTimePage
  // let attendancePage: AttendancePage
  beforeEach(() => {
    cy.task('resetMocks')
  })

  describe('Appointment type and attendance', () => {
    // const expectedUser = 'Deborah Fern (PS - Other) (Automated Allocation Team, London)'
    it('should render the page', () => {
      cy.task('stubOverviewVisorRegistration')
      loadPage()
      typePage = new AppointmentTypePage()
      typePage.checkOnPage()
      typePage.getSubmitBtn().click()
      typePage.checkErrorSummaryBox([
        'Select an appointment type',
        'Select if appointment should be included in ViSOR report',
      ])
      typePage.getRadio('type', 2).click()
      typePage.getRadio('visorReport', 2).click()
      typePage.getSubmitBtn().click()
      locationPage = new AppointmentLocationDateTimePage()
      locationPage.checkOnPage()
    })
  })
  /*
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
  })

  */
  /*
    it('should update the default user', () => {
      const changedUser = 'Iain Chambers (PS - Other) (Breach Team (Durham and Cleveland), North East Region)'
      cy.get('[data-qa="attendee"] a').click()
      cy.get('[data-qa="providerCode"]').should('have.value', 'N07')
      cy.get('[data-qa="teamCode"]').should('have.value', 'N07AAT')
      cy.get('[data-qa="username"]').should('have.value', 'peter-parker')
      cy.get('[data-qa="providerCode"]').select('N54')
      cy.get('[data-qa="teamCode"]').select('N54N03')
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
      cy.get('[data-qa="teamCode"]').should('have.value', 'N54N03')
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
    it('should refresh to error page if API call fails', () => {
      cy.get('[data-qa="attendee"] a').click()
      cy.get('[data-qa="providerCode"]').should('have.value', 'N07')
      cy.get('[data-qa="teamCode"]').should('have.value', 'N07AAT')
      cy.get('[data-qa="username"]').should('have.value', 'peter-parker')
      cy.get('[data-qa="providerCode"]').select('N50')
      cy.get('[data-qa="teamCode"]').select('N50AHA')
      const page = new ErrorPage()
      page.checkPageTitle('Sorry, there is a problem with the service')
      locationPage = new AppointmentLocationDateTimePage()
      locationPage.checkOnPage()
    })
      */
})
