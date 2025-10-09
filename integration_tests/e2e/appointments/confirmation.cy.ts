import { dateWithYear, dayOfWeek } from '../../../server/utils'
import AppointmentsPage from '../../pages/appointments'
import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import {
  completeAttendancePage,
  completeCYAPage,
  completeDateTimePage,
  completeLocationPage,
  completeRepeatingPage,
  completeSentencePage,
  completeTypePage,
  completeSupportingInformationPage,
  date,
  endTime,
  startTime,
  checkPopHeader,
  completeNextAppointmentPage,
  completeArrangeAnotherPage,
} from './imports'

const regex: RegExp = /^([A-Za-z]+)\s(\d{1,2})\s([A-Za-z]+)\s(\d{4})\sfrom\s(\d{1,2}:\d{2})\sto\s(\d{1,2}:\d{2})$/

const loadPage = (crnOverride = '') => {
  completeSentencePage(1, '', crnOverride)
  completeTypePage(1, false)
  completeAttendancePage()
  completeLocationPage(1, crnOverride)
  completeDateTimePage(crnOverride)
  completeRepeatingPage(2, crnOverride)
  completeSupportingInformationPage(true, crnOverride)
  completeCYAPage()
}
describe('Confirmation page', () => {
  let confirmPage: AppointmentConfirmationPage
  beforeEach(() => {
    cy.task('resetMocks')
    loadPage()
    confirmPage = new AppointmentConfirmationPage()
  })

  it('should render the page', () => {
    checkPopHeader('Alton Berge', true)
    confirmPage.getPanel().find('strong').should('contain.text', 'Planned office visit (NS)')
    confirmPage
      .getElement('[data-qa="appointment-date"]:nth-of-type(1)')
      .invoke('text')
      .then(text => {
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        expect(normalizedText).to.include(`${dayOfWeek(date)} ${dateWithYear(date)} from ${startTime} to ${endTime}`)
      })
    confirmPage.getElement('[data-qa="appointment-date"]:nth-of-type(2)').contains(regex)
    confirmPage.getElement('[data-qa="appointment-date"]:nth-of-type(3)').contains(regex)
    confirmPage.getWhatHappensNext().find('h2').should('contain.text', 'What happens next')
    confirmPage
      .getWhatHappensNext()
      .find('p:nth-of-type(1)')
      .invoke('text')
      .then(text => {
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        expect(normalizedText).to.include(`You need to send Alton the appointment details.`)
      })
    confirmPage
      .getWhatHappensNext()
      .find('p:nth-of-type(2)')
      .invoke('text')
      .then(text => {
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        expect(normalizedText).to.include(`Alton’s phone number is 071838893`)
      })

    confirmPage.getSubmitBtn().should('contain.text', 'Arrange next appointment')
    confirmPage.getSubmitBtn().click()
    const nextAppointmentPage = new NextAppointmentPage()
    nextAppointmentPage.checkPageTitle('Do you want to arrange the next appointment with Eula')
    nextAppointmentPage.checkOnPage()
  })

  it('should render the page with pop telephone number', () => {
    cy.task('stubPersonalDetailsNoMobileNumber')
    loadPage('X000001')
    confirmPage = new AppointmentConfirmationPage()
    confirmPage.getPopTelephone().should('contain.text', `0123456999`)
  })
  it('should render the page with no contact numbers', () => {
    cy.task('stubPersonalDetailsNoTelephoneNumbers')
    loadPage('X000001')
    confirmPage = new AppointmentConfirmationPage()
    confirmPage.getPopContactNumber().should('not.exist')
  })

  it('should link to the appointment page when practitioner click finish and no return-dest', () => {
    loadPage()
    cy.get('[data-qa="finishLink"]').click()
    const appointmentsPage = new AppointmentsPage()
    appointmentsPage.checkOnPage()
  })
})
