import {
  crn,
  uuid,
  startTime,
  endTime,
  completeTypePage,
  completeSentencePage,
  completeAttendancePage,
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
import AppointmentNotePage from '../../pages/appointments/note.page'

const loadPage = () => {
  cy.visit(`/case/${crn}/arrange-appointment/${uuid}/type`)
  completeTypePage()
  completeSentencePage()
  completeAttendancePage()
  completeLocationPage()
  completeDateTimePage()
}

describe('Add a note?', () => {
  let appointmentNotePage: AppointmentNotePage
  beforeEach(() => {
    cy.task('stubNoRepeats')
    loadPage()
    appointmentNotePage = new AppointmentNotePage()
  })
  afterEach(() => {
    cy.task('resetMocks')
  })
  it('should be on add note page', () => {
    appointmentNotePage.checkOnPage()
  })
  it('should be on the check your answers page', () => {
    appointmentNotePage.getSubmitBtn().click()
    const checkYourAnswersPage = new AppointmentCheckYourAnswersPage()
    checkYourAnswersPage.checkOnPage()
  })
})
