import 'cypress-file-upload'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import AddNotePage from '../../pages/appointmentOutcomes/add-note.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import config from '../../../server/config'
import { appointmentId } from '../appointments/imports/common'
import {
  completeSentencePage,
  completeTypePage,
  completeLocationDateTimePage,
  completeRescheduleAppointmentPage,
  getUuid,
  completeOutcome,
} from '../appointments/utils'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import { AppointmentEnforcementAction, AppointmentOutcomeType } from '../../../server/models/Appointments'

let addNotePage: AddNotePage
let manageAppointmentPage: ManageAppointmentPage
let checkYourAnswersPage: RescheduleCheckYourAnswerPage
let nextAppointmentPage: NextAppointmentPage

type Journey = 'MANAGE' | 'ARRANGE' | 'RESCHEDULE'

const crn = 'X000001'

const loadPage = ({
  journey = 'MANAGE',
  outcome = 'ATTENDED_SENT_HOME_BEHAVIOUR',
  action = 'NO_FURTHER_ACTION',
  isSensitive = false,
}: {
  journey?: Journey
  outcome?: AppointmentOutcomeType
  action?: AppointmentEnforcementAction
  isSensitive?: boolean
} = {}): void => {
  if (isSensitive) {
    cy.task('stubAppointment', { isSensitive: true, isFuture: false })
  }
  const crnParam = journey === 'ARRANGE' ? 'X778160' : 'X000001'
  if (journey === 'ARRANGE') {
    completeSentencePage()
    completeTypePage()
    completeLocationDateTimePage({ dateInPast: true })
  }
  if (journey === 'MANAGE') {
    cy.visit('/case/X000001/appointments/appointment/6/manage')
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage.getTaskLink(1).click()
  }
  if (journey === 'RESCHEDULE') {
    completeRescheduleAppointmentPage({ crn: crnParam })
    checkYourAnswersPage = new RescheduleCheckYourAnswerPage()
    checkYourAnswersPage.getSubmitBtn().click()
    getUuid(2).then(pageUuid => {
      completeLocationDateTimePage({ dateInPast: true, uuidOveride: pageUuid, crnOverride: crn })
    })
  }
  completeOutcome({ outcome, action })
  addNotePage = new AddNotePage()
}

const createFakeFile = (mb: number, type: string): Cypress.FixtureData => {
  const fileSize = mb * 1024 * 1024
  const fileContent = new Blob(['a'.repeat(fileSize)], { type: 'text/plain' })
  const fileName = `fake${mb}mb.${type}`
  const mimeType = Object.keys(config.validMimeTypes).includes(type)
    ? config.validMimeTypes[type]
    : `application/${type}`
  return { fileContent, fileName, mimeType }
}

describe('Add a note', () => {
  afterEach(() => {
    cy.task('resetMocks')
  })
  describe('Manage appointment journey', () => {
    it('switch to criss headers format when option selected', () => {
      loadPage()
      getUuid(3).then(_ => {
        addNotePage.getCrissRadio().eq(1).check()
        cy.get(`[id="freeform-container"]`).should('have.class', 'govuk-!-display-none')
        cy.get(`[id="structured-container"]`).should('not.have.class', 'govuk-!-display-none')
      })
    })
    it('rejects files larger than 5mb', () => {
      loadPage()
      addNotePage = new AddNotePage()
      addNotePage.checkOnPage()
      addNotePage.getFileUploadInput().attachFile(createFakeFile(6, 'pdf'))
      addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
      addNotePage.getSubmitBtn().click()
      addNotePage.checkErrorSummaryBox(['File size must be 5mb or under'])
    })
    ;(['pdf', 'doc', 'docx'] as const).forEach(filetype => {
      it(`uploads a valid ${filetype} file`, () => {
        cy.task('stubPatchDocument200Response')
        cy.intercept('POST', '/case/*/appointments/appointment/*/outcome/add-note').as('submit')
        loadPage()
        addNotePage.getFileUploadInput().attachFile(createFakeFile(1, filetype))
        cy.get(`[id="freeform-container"]`).find('textarea').type('Test note')
        addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
        addNotePage.getSubmitBtn().click()
        cy.wait('@submit')
        nextAppointmentPage = new NextAppointmentPage()
        nextAppointmentPage.checkPageTitle(`Eula’s next supervision appointment`)
      })
    })
    it('shows error when note exceeds 12000 characters', () => {
      loadPage()
      cy.get(`#appointments-${crn}-${appointmentId}-notes`).invoke('val', 'x'.repeat(12001)).trigger('input')
      addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
      addNotePage.getSubmitBtn().click()
      addNotePage.checkErrorSummaryBox(['Note must be 12000 characters or less'])
      cy.get('.govuk-character-count__status').should('contain.text', 'You have 1 character too many')
    })
    it('shows error when sensitivity is not selected', () => {
      loadPage()
      cy.get(`#appointments-${crn}-${appointmentId}-notes`).invoke('val', 'x'.repeat(20)).trigger('input')
      addNotePage.getSubmitBtn().click()
      addNotePage.checkErrorSummaryBox(['Select whether or not the appointment note contains sensitive information'])
      addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
      addNotePage.getSubmitBtn().click()
      nextAppointmentPage = new NextAppointmentPage()
    })
  })

  it('should render the page in the arrange appointment journey', () => {
    loadPage({ journey: 'ARRANGE' })
    addNotePage = new AddNotePage()
    addNotePage.checkOnPage()
    addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
    addNotePage.getSubmitBtn().click()
    const cyaPage = new AppointmentCheckYourAnswersPage()
    cyaPage.checkPageTitle('Check your answers')
  })
  it('should render the page in the reschedule appointment journey', () => {
    loadPage({ journey: 'RESCHEDULE' })
    addNotePage = new AddNotePage()
    addNotePage.checkOnPage()
    addNotePage.getSensitiveInformation().find('.govuk-radios__input').first().click()
    addNotePage.getSubmitBtn().click()
    const cyaPage = new AppointmentCheckYourAnswersPage()
    cyaPage.checkPageTitle('Change appointment details and reschedule')
  })
})
