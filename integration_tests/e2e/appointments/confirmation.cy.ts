import { dateWithYear, dayOfWeek } from '../../../server/utils'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import {
  completeCYAPage,
  completeSentencePage,
  completeTypePage,
  completeSupportingInformationPage,
  date,
  endTime,
  startTime,
  checkPopHeader,
  completeLocationDateTimePage,
} from './imports'
import OverviewPage from '../../pages/overview'
import YourCasesPage from '../../pages/myCases'

const loadPage = (crnOverride = '') => {
  completeSentencePage(1, '', crnOverride)
  completeTypePage(1, false)
  completeLocationDateTimePage({ index: 1, crnOverride })
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
    confirmPage.getWhatHappensNext().find('h2').should('contain.text', 'What happens next')
    confirmPage
      .getWhatHappensNext()
      .find('p:nth-of-type(1)')
      .invoke('text')
      .then(text => {
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        expect(normalizedText).to.include(
          `You need to send Alton the appointment details. Their phone number is 071838893.`,
        )
      })
    confirmPage
      .getWhatHappensNext()
      .find('p:nth-of-type(2)')
      .invoke('text')
      .then(text => {
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        expect(normalizedText).to.include(`The appointment has been added to:`)
      })
    cy.get('[data-qa="outlook-msg"] li').eq(0).should('contain', 'your calendar')
    cy.get('[data-qa="outlook-msg"] li')
      .eq(1)
      .should('contain', 'the NDelius contact log and officer diary, along with any supporting information')
    cy.get('[data-qa="outlook-err-msg-1"]').should('not.exist')
    cy.get('[data-qa="outlook-err-msg-2"]').should('not.exist')

    confirmPage.getSubmitBtn().should('contain.text', "Return to Alton's overview")
    confirmPage.getSubmitBtn().click()
    const nextAppointmentPage = new OverviewPage()
    nextAppointmentPage.getTab('overview').should('contain.text', 'Overview')
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

  it('should link to the appointment page when practitioner click Return to all cases', () => {
    loadPage()
    cy.get('[data-qa="returnToAllCases"]').click()
    const appointmentsPage = new YourCasesPage()
    appointmentsPage.checkOnPage()
  })

  it('should link to the next appointment page when practitioner clicks Arrange another appointment', () => {
    loadPage()
    cy.get('[data-qa="anotherAppointmentLink"]').click()
    const nextAppointmentsPage = new NextAppointmentPage()
    nextAppointmentsPage.getBackLink().click()
    confirmPage.checkOnPage()
  })

  describe('Should render the page with error message, when SVA client API call fails', () => {
    beforeEach(() => {
      cy.task('resetMocks')
      cy.task('stubSchuleOutlookEvent500Response')
      loadPage()
      confirmPage = new AppointmentConfirmationPage()
    })
    it('should render the page with error message', () => {
      checkPopHeader('Alton Berge', true)
      confirmPage.getPanel().find('strong').should('contain.text', 'Planned office visit (NS)')
      confirmPage
        .getElement('[data-qa="appointment-date"]:nth-of-type(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          expect(normalizedText).to.include(`${dayOfWeek(date)} ${dateWithYear(date)} from ${startTime} to ${endTime}`)
        })
      confirmPage.getWhatHappensNext().find('h2').should('contain.text', 'What happens next')
      confirmPage
        .getWhatHappensNext()
        .find('p:nth-of-type(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          expect(normalizedText).to.include(
            `You need to send Alton the appointment details. Their phone number is 071838893.`,
          )
        })

      cy.get('[data-qa="outlook-err-msg-1"]').should(
        'contain',
        'There is a technical problem with Outlook and we could not send you a calendar invitation.',
      )
      cy.get('[data-qa="outlook-err-msg-2"]').should(
        'contain',
        'The appointment has been added to the NDelius contact log and officer diary, along with any supporting information.',
      )

      confirmPage.getSubmitBtn().click()
      const nextAppointmentPage = new OverviewPage()
      nextAppointmentPage.getTab('overview').should('contain.text', 'Overview')
      nextAppointmentPage.checkOnPage()
    })
  })

  describe('User details error', () => {
    beforeEach(() => {
      cy.task('resetMocks')
      cy.task('stubUserDetails404Response')
      loadPage()
      confirmPage = new AppointmentConfirmationPage()
    })
    it('should render the page with error message when no user details found from MAS API', () => {
      checkPopHeader('Alton Berge', true)
      confirmPage.getPanel().find('strong').should('contain.text', 'Planned office visit (NS)')
      confirmPage
        .getElement('[data-qa="appointment-date"]:nth-of-type(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          expect(normalizedText).to.include(`${dayOfWeek(date)} ${dateWithYear(date)} from ${startTime} to ${endTime}`)
        })
      confirmPage.getWhatHappensNext().find('h2').should('contain.text', 'What happens next')
      confirmPage
        .getWhatHappensNext()
        .find('p:nth-of-type(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          expect(normalizedText).to.include(
            `You need to send Alton the appointment details. Their phone number is 071838893.`,
          )
        })

      cy.get('[data-qa="outlook-err-msg-1"]').should(
        'contain',
        'There is a technical problem with Outlook and we could not send you a calendar invitation.',
      )
      cy.get('[data-qa="outlook-err-msg-2"]').should(
        'contain',
        'The appointment has been added to the NDelius contact log and officer diary, along with any supporting information.',
      )

      confirmPage.getSubmitBtn().click()
      const nextAppointmentPage = new OverviewPage()
      nextAppointmentPage.getTab('overview').should('contain.text', 'Overview')
      nextAppointmentPage.checkOnPage()
    })
  })
})
