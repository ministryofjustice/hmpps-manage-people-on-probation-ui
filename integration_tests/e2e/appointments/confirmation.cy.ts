import { dateWithYear, dayOfWeek } from '../../../server/utils'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import {
  completeAttendancePage,
  completeCYAPage,
  completeDateTimePage,
  completeLocationPage,
  completePreviewPage,
  completeRepeatingPage,
  completeSentencePage,
  completeTypePage,
  date,
  endTime,
  startTime,
} from './imports'

const regex: RegExp =
  /^([A-Za-z]+)\s(\d{1,2})\s([A-Za-z]+)\s(\d{4})\sfrom\s(\d{1,2}:\d{2}[ap]m)\sto\s(\d{1,2}:\d{2}[ap]m)$/

const loadPage = () => {
  completeTypePage()
  completeSentencePage()
  completeAttendancePage()
  completeLocationPage()
  completeDateTimePage()
  completeRepeatingPage()
  completePreviewPage()
  completeCYAPage()
}
describe('Appointments arranged', () => {
  let confirmPage: AppointmentConfirmationPage
  beforeEach(() => {
    loadPage()
    confirmPage = new AppointmentConfirmationPage()
  })
  it('should render the page', () => {
    confirmPage.getPanel().find('strong').should('contain.text', '3 Way Meeting (NS)')
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
        expect(normalizedText).to.include(`Alton’s phone number is 0123456999.`)
      })

    confirmPage.getSubmitBtn().should('contain.text', 'Finish')
    confirmPage.getSubmitBtn().click()
    cy.location().should(location => {
      expect(location.href).to.eq('http://localhost:3007/')
    })
  })
})
