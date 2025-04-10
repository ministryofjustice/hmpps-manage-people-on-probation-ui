import {
  crn,
  uuid,
  startTime,
  endTime,
  completeTypePage,
  completeSentencePage,
  completeLocationPage,
  completeDateTimePage,
  completeRepeatingPage,
  dateRegex,
  date,
} from './imports'
import AppointmentPreviewPage from '../../pages/appointments/preview.page'
import { dateWithYear, dayOfWeek } from '../../../server/utils'
import AppointmentRepeatingPage from '../../pages/appointments/repeating.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'

const id = 'this-appointment'
const repeatId = 'repeat-appointments'

const loadPage = (repeat = 2) => {
  cy.visit(`/case/${crn}/arrange-appointment/${uuid}/type`)
  completeTypePage()
  completeSentencePage()
  completeLocationPage()
  completeDateTimePage()
  completeRepeatingPage(repeat)
}

const checkThisAppointment = (previewPage: AppointmentPreviewPage) => {
  previewPage.getAppointmentHeading(id).should('include.text', 'This appointment')
  previewPage.getAppointmentTableHeading(id, 1).should('include.text', 'Date')
  previewPage.getAppointmentTableHeading(id, 2).should('include.text', 'Time')
  previewPage.getAppointmentRows(id).should('have.length', 1)
  previewPage.getAppointmentRowDate(id, 1).should('include.text', `${dayOfWeek(date)} ${dateWithYear(date)}`)
  previewPage.getAppointmentRowTime(id, 1).should('include.text', `${startTime} to ${endTime}`)
}

describe('Will the appointment repeat?', () => {
  let previewPage: AppointmentPreviewPage
  beforeEach(() => {
    loadPage()
    previewPage = new AppointmentPreviewPage()
  })
  it('should render the page', () => {
    previewPage.checkOnPage()
    checkThisAppointment(previewPage)
  })
  describe('Back link', () => {
    beforeEach(() => {
      loadPage()
      previewPage = new AppointmentPreviewPage()
      previewPage.getBackLink().click()
    })
    it('should render the repeating page', () => {
      const repeatingPage = new AppointmentRepeatingPage()
      repeatingPage.checkOnPage()
    })
  })
  describe('2 repeat appointments', () => {
    beforeEach(() => {
      loadPage()
      previewPage = new AppointmentPreviewPage()
    })
    it('should render the page', () => {
      previewPage.getAppointmentHeading(repeatId).should('include.text', `2 repeat appointments`)
      previewPage.getAppointmentTableHeading(repeatId, 1).should('include.text', 'Date')
      previewPage.getAppointmentTableHeading(repeatId, 2).should('include.text', 'Time')
      previewPage.getAppointmentRows(repeatId).should('have.length', 2)
      previewPage.getAppointmentRowDate(repeatId, 1).contains(dateRegex)
      previewPage.getAppointmentRowTime(repeatId, 1).should('include.text', `${startTime} to ${endTime}`)
      previewPage.getAppointmentRowDate(repeatId, 2).contains(dateRegex)
      previewPage.getAppointmentRowTime(repeatId, 2).should('include.text', `${startTime} to ${endTime}`)
      previewPage.getSubmitBtn().should('contain.text', 'Continue')
    })
  })
  describe('No repeat appointments', () => {
    const repeat = 0
    beforeEach(() => {
      loadPage(repeat)
      previewPage = new AppointmentPreviewPage()
    })
    it('should render the page', () => {
      cy.get(`section[data-qa="${repeatId}"]`).should('not.exist')
      checkThisAppointment(previewPage)
    })
  })
  describe('Continue button is clicked', () => {
    beforeEach(() => {
      loadPage()
      previewPage = new AppointmentPreviewPage()
      previewPage.getSubmitBtn().click()
    })
    it('should render the check your answers page', () => {
      const cyaPage = new AppointmentCheckYourAnswersPage()
      cyaPage.checkOnPage()
    })
  })
})
