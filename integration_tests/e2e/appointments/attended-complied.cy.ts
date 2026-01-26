import { DateTime } from 'luxon'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import AttendedCompliedPage from '../../pages/appointments/attended-complied.page'
import {
  completeLocationDateTimePage,
  completeSentencePage,
  completeTypePage,
  checkLogOutcomesAlert,
  checkPopHeader,
  crn,
  uuid,
} from './imports'
import { dateWithYear } from '../../../server/utils'

const appointmentId = '6'

const loadManagePage = () => {
  cy.visit(`/case/${crn}/appointments/appointment/${appointmentId}/manage`)
}

const loadPage = () => {
  completeSentencePage()
  completeTypePage()
  completeLocationDateTimePage({ dateInPast: true })
}

const isAttendedCompliedPage = true

describe('Log attended and complied appointment', () => {
  let manageAppointmentPage: ManageAppointmentPage
  let recordAnOutcomePage: AttendedCompliedPage
  let addNotePage: AddNotePage

  const getId = (manageJourney = false) =>
    manageJourney ? 'outcomeRecorded' : `appointments-${crn}-${uuid}-outcomeRecorded`

  const checkContent = (manageJourney = false) => {
    const name = 'Alton Berge'
    const now = DateTime.now()
    const yesterday = now.minus({ days: 1 })
    const date = dateWithYear(yesterday.toISODate())
    const dayName = yesterday.toFormat('cccc')
    const appointmentText = manageJourney
      ? '3 Way Meeting (NS) with Terry Jones on Wednesday 21 February 2024'
      : `Planned Office Visit (NS) with Deborah Fern on ${dayName} ${date}`
    const id = getId(manageJourney)
    cy.get(`#${id}-hint`).should('contain.text', `Appointment: ${appointmentText}.`)
    cy.get(`label[for="${id}"]`).should('contain.text', `Yes, ${name.split(' ')[0]} attended and complied`)
    checkPopHeader(name, true)
  }

  const checkValidation = (manageJourney = false) => {
    const name = 'Alton'
    const id = getId(manageJourney)
    it('should reveal validation error if the user submits without selecting the checkbox', () => {
      recordAnOutcomePage = new AttendedCompliedPage()
      recordAnOutcomePage.getSubmitBtn().click()
      checkContent(manageJourney)
      checkLogOutcomesAlert(isAttendedCompliedPage)
      recordAnOutcomePage.checkPageTitle(`Confirm ${name} attended and complied`)
      recordAnOutcomePage.checkErrorSummaryBox(['Select if they attended and complied'])
      recordAnOutcomePage.getElement(`#${id}-error`).should($error => {
        expect($error.text().trim()).to.include('Select if they attended and complied')
      })
    })
  }
  beforeEach(() => {
    cy.task('resetMocks')
  })
  describe('Manage appointment journey', () => {
    const manageJourney = true

    beforeEach(() => {
      cy.task('stubPastAppointmentNoOutcomeNoNotes')
      loadManagePage()
      manageAppointmentPage = new ManageAppointmentPage()
      manageAppointmentPage.getTaskLink(1).click()
    })
    it('should render page with correct elements', () => {
      checkContent(manageJourney)
    })
    checkLogOutcomesAlert(isAttendedCompliedPage)
    it('should navigate to add appointment notes if the user submits after selecting the checkbox', () => {
      recordAnOutcomePage = new AttendedCompliedPage()
      cy.get('#outcomeRecorded').click()
      recordAnOutcomePage.getSubmitBtn().click()
      addNotePage = new AddNotePage()
    })
    it('should return to management appointment when cancel link is clicked', () => {
      cy.get('[data-qa=cancelGoBackLink]').should('contain.text', 'Cancel and go back').click()
      manageAppointmentPage = new ManageAppointmentPage()
    })
    checkValidation(manageJourney)
  })
  describe('Arrange appointment journey - date selected in the past', () => {
    beforeEach(() => {
      loadPage()
    })
    it('should link to the attended and complied page', () => {
      recordAnOutcomePage = new AttendedCompliedPage()
      recordAnOutcomePage.checkPageTitle('Confirm Alton attended and complied')
    })
    it('should render page with correct elements', () => {
      checkContent()
    })
    checkLogOutcomesAlert(isAttendedCompliedPage)
    checkValidation()
    it('should link to the add notes page', () => {
      const id = getId()
      cy.get(`#${id}`).click()
      recordAnOutcomePage.getSubmitBtn().click()
      addNotePage = new AddNotePage()
      addNotePage.checkOnPage()
    })
  })
})
