import 'cypress-plugin-tab'
import { DateTime } from 'luxon'
import AppointmentSentencePage from '../../pages/appointments/sentence.page'
import AppointmentTypePage from '../../pages/appointments/type.page'
import AppointmentPreviewPage from '../../pages/appointments/preview.page'
import AppointmentCheckYourAnswersPage from '../../pages/appointments/check-your-answers.page'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'
import AttendancePage from '../../pages/appointments/attendance.page'
import AppointmentNotePage from '../../pages/appointments/note.page'
import ArrangeAnotherAppointmentPage from '../../pages/appointments/arrange-another-appointment.page'
import { dateWithYear } from '../../../server/utils'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import NextAppointmentPage from '../../pages/appointments/next-appointment.page'
import AppointmentLocationDateTimePage from '../../pages/appointments/location-date-time.page'
import AttendedCompliedPage from '../../pages/appointments/attended-complied.page'
import AddNotePage from '../../pages/appointments/add-note.page'
import RescheduleAppointmentPage from '../../pages/appointments/reschedule-appointment.page'
import TextMessageConfirmationPage from '../../pages/appointments/text-message-confirmation.page'

export const crn = 'X778160'
export const uuid = '19a88188-6013-43a7-bb4d-6e338516818f'
export const date = DateTime.now().plus({ days: 1 }).toISODate()
export const pastDate = DateTime.now().minus({ days: 1 }).toISODate()
export const startTime = '09:00'
export const endTime = '10:00'
export const dateRegex: RegExp =
  /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) \d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/

interface Args {
  hasOutcome?: boolean
  deliusManaged?: boolean
  acceptableAbsence?: boolean
  hasComplied?: boolean
  task?: string
  withNotesTask?: string
  noNotesTask?: string
  hasRarActivity?: boolean
  withLocationOfficeNameTask?: string
}

export const getUuid = (index = 2) => {
  return cy.url().then(currentUrl => {
    const split = currentUrl.split('?')[0].split('/')
    return split[split.length - index]
  })
}

export const getCheckinUuid = () => {
  return cy.url().then(currentUrl => {
    const split = currentUrl.split('?')[0].split('/')
    return split[split.length - 3]
  })
}

export const getCrn = () => {
  return cy.url().then(currentUrl => {
    const split = currentUrl.split('?')[0].split('/')
    return split[split.length - 4]
  })
}

export const completeTypePage = (index = 1, hasVisor = false) => {
  const typePage = new AppointmentTypePage()
  typePage.getRadio('type', index).click()
  if (hasVisor) {
    typePage.getRadio('visorReport', index).click()
  }
  typePage.getSubmitBtn().click()
}

export const normalise = (text: string) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/\n/g, '')
    .replace(/\s*<br>\s*/g, '<br>')
    .replace(/\s+/g, ' ')
    .trim()

export const completeSentencePage = (eventIndex = 1, query = '', crnOverride = '') => {
  const tomorrow = DateTime.now().plus({ days: 1 }).set({
    hour: 9,
    minute: 30,
    second: 0,
    millisecond: 0,
  })

  cy.clock(tomorrow.toMillis())
  cy.visit(`/case/${crnOverride || crn}/arrange-appointment/${uuid}/sentence${query}`, { failOnStatusCode: false })
  const sentencePage = new AppointmentSentencePage()
  const suffix = eventIndex !== 1 ? `-${eventIndex}` : ''
  sentencePage.getElement(`#appointments-${crnOverride || crn}-${uuid}-eventId${suffix}`).click()

  if (eventIndex === 3 && !crnOverride) {
    sentencePage.getElement(`#appointments-${crnOverride || crn}-${uuid}-nsiId`).click()
  }
  sentencePage.getSubmitBtn().click()
}

export const completeAttendancePage = () => {
  const attendancePage = new AttendancePage()
  attendancePage.getSubmitBtn().click()
}

interface Props {
  index?: number
  crnOverride?: string
  uuidOveride?: string
  next?: boolean
  dateInPast?: boolean
  dateOverride?: DateTime
}

export const completeLocationDateTimePage = ({
  index = 1,
  crnOverride = '',
  uuidOveride = '',
  dateInPast = false,
  dateOverride,
}: Props = {}) => {
  const suffix = index > 1 ? `-${index}` : ''
  const locationDateTimePage = new AppointmentLocationDateTimePage()
  const now = DateTime.now()
  const yesterday = now.minus({ days: 1 })
  const tomorrow = now.plus({ days: 1 })
  const yesterdayIsInCurrentMonth = yesterday.month === now.month
  const tomorrowIsInCurrentMonth = tomorrow.month === now.month
  locationDateTimePage.getDatePickerToggle().click()
  if (dateOverride) {
    const diff = (dateOverride.year - now.year) * 12 + (dateOverride.month - now.month)
    if (diff < 0) {
      for (let i = 0; i > diff; i -= 1) {
        cy.get('.moj-js-datepicker-prev-month').click()
      }
    }
    if (diff > 0) {
      for (let i = 0; i < diff; i += 1) {
        cy.get('.moj-js-datepicker-next-month').click()
      }
    }
    cy.get(`[data-testid="${dateOverride.toFormat('d/M/yyyy')}"]`).click()
  } else if (!dateInPast) {
    if (!tomorrowIsInCurrentMonth) {
      cy.get('.moj-js-datepicker-next-month').click()
    }
    cy.get(`[data-testid="${tomorrow.toFormat('d/M/yyyy')}"]`).click()
  } else {
    if (!yesterdayIsInCurrentMonth) {
      cy.get('.moj-js-datepicker-prev-month').click()
    }
    cy.get(`[data-testid="${yesterday.toFormat('d/M/yyyy')}"]`).click()
  }
  locationDateTimePage.getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-start`).type(startTime)
  locationDateTimePage
    .getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-end`)
    .focus()
    .type(endTime)
  locationDateTimePage
    .getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-user-locationCode${suffix}`)
    .click()
  locationDateTimePage.getSubmitBtn().click()
  locationDateTimePage.getSubmitBtn().click()
}

export const completeTextMessageConfirmationPage = ({ _crn = null, _uuid = uuid, index = 2 } = {}) => {
  const suffix = index > 1 ? `-${index}` : ''
  const textMessageConfirmPage = new TextMessageConfirmationPage()
  textMessageConfirmPage
    .getSmsOptIn()
    .find(`#appointments-${_crn || crn}-${_uuid}-smsOptIn${suffix}`)
    .click()
  textMessageConfirmPage.getSubmitBtn().click()
}

export const completeAttendedCompliedPage = (manageJourney = false) => {
  const idPrefix = manageJourney ? '' : `appointments-${crn}-${uuid}-`
  const logOutcomePage = new AttendedCompliedPage()
  cy.get(`#${idPrefix}outcomeRecorded`).click()
  logOutcomePage.getSubmitBtn().click()
}

export const completeAddNotePage = (crnOverride = '', uuidOveride = '') => {
  const addNotePage = new AddNotePage()
  addNotePage.getSensitiveInformation().find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
  addNotePage
    .getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-notes`)
    .focus()
    .type('Some notes')
  addNotePage.getSubmitBtn().click()
}

export const completeSupportingInformationPage = (notes = true, crnOverride = '', uuidOveride = '') => {
  const notePage = new AppointmentNotePage()
  cy.get('form').then(form => form[0].reset())
  if (notes) {
    notePage
      .getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-notes`)
      .focus()
      .type('Some notes')
  }
  notePage.getElement(`#appointments-${crnOverride || crn}-${uuidOveride || uuid}-sensitivity`).click()
  notePage.getSubmitBtn().click()
}

export const completePreviewPage = () => {
  const previewPage = new AppointmentPreviewPage()
  previewPage.getSubmitBtn().click()
}
export const completeCYAPage = () => {
  const cyaPage = new AppointmentCheckYourAnswersPage()
  cyaPage.getSubmitBtn().click()
}
export const checkPopHeader = (
  name = 'Caroline Wolff',
  appointments = false,
  headerCrn = 'X000001',
  tierLinkEnabled = true,
) => {
  cy.clock(DateTime.now().toMillis())
  cy.get('h1').should('contain.text', name)
  cy.get('[data-qa="crn"]').should('contain.text', headerCrn)
  cy.get('[data-qa="headerDateOfBirthValue"]').should('contain.text', '18 August 1979')
  cy.get('[data-qa="headerDateOfBirthAge"]').should('contain.text', '46')
  if (tierLinkEnabled) {
    cy.get('[data-qa="tierLink"]')
      .should('contain.text', appointments ? 'A3' : 'B2')
      .should('have.attr', 'href', `https://tier-dev.hmpps.service.justice.gov.uk/case/${headerCrn}`)
    cy.get('[data-qa="tierValue"]').should('not.exist')
  } else {
    cy.get('[data-qa="tierValue"]').should('contain.text', appointments ? 'A3' : 'B2')
    cy.get('[data-qa="tierLink"]').should('not.exist')
  }
  cy.get('.predictor-timeline-item').eq(0).find('.predictor-timeline-item__level').should('contain.text', 'ROSH')
  cy.get('.predictor-timeline-item')
    .eq(0)
    .find('.predictor-timeline-item__level')
    .should('contain.text', appointments ? 'HIGH' : 'VERY HIGH')
  if (!appointments) {
    cy.get('.predictor-timeline-item').eq(1).find('.predictor-timeline-item__level').should('contain.text', 'RSR')
    cy.get('.predictor-timeline-item').eq(1).find('.predictor-timeline-item__level').should('contain.text', 'MEDIUM')
    cy.get('.predictor-timeline-item').eq(1).find('.predictor-timeline-item__score').should('contain.text', '12.1')
  }
}

export const completeConfirmationPage = () => {
  const confirmationPage = new AppointmentConfirmationPage()
  confirmationPage.getSubmitBtn().click()
}

export const completeArrangeAnotherPage = () => {
  const arrangeAnotherAppointmentPage = new ArrangeAnotherAppointmentPage()
  checkUpdateDateTime(arrangeAnotherAppointmentPage)
  arrangeAnotherAppointmentPage.getSubmitBtn().click()
}

export const completeNextAppointmentPage = (index = 1) => {
  const nextAppointmentPage = new NextAppointmentPage()
  nextAppointmentPage.getRadio('option', index).click()
  nextAppointmentPage.getSubmitBtn().click()
}

interface SummaryProps {
  page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage | RescheduleCheckYourAnswerPage
  probationPractitioner?: boolean
  dateInPast?: boolean
  sendTextMessage?: boolean
  summaryHasDate?: boolean
  smsFeatureFlagDisabled?: boolean
}

export const checkAppointmentSummary = ({
  page,
  probationPractitioner = false,
  dateInPast = false,
  sendTextMessage = true,
  summaryHasDate = true,
  smsFeatureFlagDisabled = false,
}: SummaryProps) => {
  const appointmentFor =
    page instanceof RescheduleCheckYourAnswerPage ? 'Default Sentence Type (12 Months)' : '12 month Community order'
  let attending = 'Deborah Fern (PS - Other) (Automated Allocation Team, London)'
  if (
    page instanceof ArrangeAnotherAppointmentPage ||
    (!(page instanceof AppointmentCheckYourAnswersPage) && probationPractitioner)
  ) {
    attending = 'Peter Parker (PS-PSO) (Automated Allocation Team, London)'
  }
  if (page instanceof RescheduleCheckYourAnswerPage) {
    attending = 'Terry Jones (PS-PSO) (Automated Allocation Team, London)'
  }

  const location =
    page instanceof RescheduleCheckYourAnswerPage
      ? ['The Building', '77 Some Street', 'Some City Centre', 'London', 'Essex', 'NW10 1EP']
      : ['Love Lane', 'Wakefield', 'West Yorkshire', 'WF2 9AG']
  page.getSummaryListRow(1).find('.govuk-summary-list__key').should('contain.text', 'Appointment for')
  page.getSummaryListRow(1).find('.govuk-summary-list__value').should('contain.text', appointmentFor)
  page.getSummaryListRow(2).find('.govuk-summary-list__key').should('contain.text', 'Appointment type')
  page.getSummaryListRow(2).find('.govuk-summary-list__value').should('contain.text', 'Planned office visit (NS)')
  page.getSummaryListRow(2).find('.govuk-summary-list__key').should('not.have.text', 'VISOR report')
  page.getSummaryListRow(3).find('.govuk-summary-list__key').should('contain.text', 'Attending')
  page.getSummaryListRow(3).find('.govuk-summary-list__value').should('contain.text', attending)
  page.getSummaryListRow(4).find('.govuk-summary-list__key').should('contain.text', 'Location')
  for (const line of location) {
    page.getSummaryListRow(4).find('.govuk-summary-list__value').should('contain.text', line)
  }

  page.getSummaryListRow(5).find('.govuk-summary-list__key').should('contain.text', 'Date and time')
  if (page instanceof AppointmentCheckYourAnswersPage) {
    page
      .getSummaryListRow(5)
      .find('.govuk-summary-list__value li:nth-child(1)')
      .invoke('text')
      .then(text => {
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        if (dateInPast) {
          expect(normalizedText).to.include(
            `${dateWithYear(pastDate)} at ${to24HourTimeWithMinutes(startTime)} to ${to24HourTimeWithMinutes(endTime)}`,
          )
        } else {
          expect(normalizedText).to.include(
            `${dateWithYear(date)} at ${to24HourTimeWithMinutes(startTime)} to ${to24HourTimeWithMinutes(endTime)}`,
          )
        }
      })
  }
  if (!(page instanceof AppointmentCheckYourAnswersPage)) {
    page.getSummaryListRow(5).find('.govuk-summary-list__value').should('contain.text', 'Not entered')
  }

  const index = dateInPast ? 1 : 0

  if (dateInPast) {
    page.getSummaryListRow(6).find('.govuk-summary-list__key').should('contain.text', 'Attended and complied')
    page.getSummaryListRow(6).find('.govuk-summary-list__value').should('contain.text', 'Yes')
  }
  if (!dateInPast && !smsFeatureFlagDisabled) {
    page
      .getSummaryListRow(6 + index)
      .find('.govuk-summary-list__key')
      .should('contain.text', 'Text message confirmation')
    let textMessageConfirmValue = sendTextMessage ? 'Yes' : 'No'
    if (!summaryHasDate) textMessageConfirmValue = 'Not entered'
    page
      .getSummaryListRow(6 + index)
      .find('.govuk-summary-list__value')
      .should('contain.text', textMessageConfirmValue)
    if (!summaryHasDate) {
      page
        .getSummaryListRow(6 + index)
        .find('.govuk-summary-list__value')
        .find('.govuk-summary-list__hint')
        .should('contain.text', 'Select the appointment date first.')
    }
    page
      .getSummaryListRow(6 + index)
      .find('.govuk-summary-list__value')
      .should(sendTextMessage ? 'contain.text' : 'not.contain.text', '07703123456')
  }
  page
    .getSummaryListRow((!dateInPast && !smsFeatureFlagDisabled ? 7 : 6) + index)
    .find('.govuk-summary-list__key')
    .should('contain.text', 'Supporting information')
  page
    .getSummaryListRow((!dateInPast && !smsFeatureFlagDisabled ? 7 : 6) + index)
    .find('.govuk-summary-list__value')
    .should('contain.text', !(page instanceof AppointmentCheckYourAnswersPage) ? 'Not entered' : 'Some notes')
  page
    .getSummaryListRow((!dateInPast && !smsFeatureFlagDisabled ? 8 : 7) + index)
    .find('.govuk-summary-list__key')
    .should('contain.text', 'Sensitivity')
  page
    .getSummaryListRow((!dateInPast && !smsFeatureFlagDisabled ? 8 : 7) + index)
    .find('.govuk-summary-list__value')
    .should('contain.text', !(page instanceof AppointmentCheckYourAnswersPage) ? 'Not entered' : 'Yes')
}

export const checkUpdateType = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  page.getSummaryListRow(2).find('.govuk-link').click()
  const typePage = new AppointmentTypePage()
  typePage.getRadio('type', 2).click()
  typePage.getSubmitBtn().click()
  if (page instanceof ArrangeAnotherAppointmentPage) {
    getUuid().then(pageUuid => {
      completeLocationDateTimePage({ index: 1, uuidOveride: pageUuid })
      completeTextMessageConfirmationPage({ _crn: crn, _uuid: pageUuid, index: 1 })
      completeSupportingInformationPage(true, '', pageUuid)
    })
  }
  page.getSummaryListRow(2).find('.govuk-summary-list__value').should('contain.text', 'Planned telephone contact (NS)')
}

export const checkUpdateSentence = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  getUuid().then(pageUuid => {
    page.getSummaryListRow(1).find('.govuk-link').click()
    const sentencePage = new AppointmentSentencePage()
    sentencePage.getElement(`#appointments-${crn}-${pageUuid}-eventId-2`).click()
    sentencePage.getSubmitBtn().click()
    if (!(page instanceof AppointmentCheckYourAnswersPage)) {
      completeLocationDateTimePage({ index: 1, uuidOveride: pageUuid })
      completeTextMessageConfirmationPage({ _crn: crn, _uuid: pageUuid, index: 1 })
      completeSupportingInformationPage(true, '', pageUuid)
    }
    page.checkOnPage()
  })
}

export const checkUpdateLocation = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  page.getSummaryListRow(4).find('.govuk-link').click()
  const locationPage = new AppointmentLocationDateTimePage()
  locationPage.getRadio('locationCode', 2).click()
  locationPage.getDatePickerToggle().click()
  locationPage.getNextDayButton().click()
  getUuid().then(uuidOveride => {
    locationPage.getElement(`#appointments-${crn}-${uuidOveride}-start`).type(startTime)
    locationPage.getElement(`#appointments-${crn}-${uuidOveride}-end`).focus().type(endTime)
  })
  locationPage.getSubmitBtn().click()
  locationPage.getSubmitBtn().click()
  if (!(page instanceof AppointmentCheckYourAnswersPage)) {
    getUuid().then(pageUuid => {
      completeTextMessageConfirmationPage({ _crn: crn, _uuid: pageUuid, index: 1 })
      completeSupportingInformationPage(true, '', pageUuid)
    })
  }
  page.checkOnPage()
  page.getSummaryListRow(4).find('.govuk-summary-list__value').should('contain.text', '102 Petty France')
}

export const checkUpdateDateTime = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  getCrn().then(pageCrn => {
    getUuid().then(pageUuid => {
      const newDate = DateTime.now().plus({ days: 2 }).set({
        hour: 7,
        minute: 30,
        second: 0,
        millisecond: 0,
      })

      const changedStart = '09:30'
      const changedEnd = '10:30'
      page.getSummaryListRow(5).find('.govuk-link').click()
      const dateTimePage = new AppointmentLocationDateTimePage()
      dateTimePage.getDatePickerToggle().click()
      if (newDate.month !== DateTime.now().month) {
        cy.get('.moj-js-datepicker-next-month').click()
      }
      cy.get(`[data-testid="${newDate.day}/${newDate.month}/${newDate.year}"]`).click()
      dateTimePage.getElement(`#appointments-${pageCrn}-${pageUuid}-start`).clear()
      dateTimePage.getElement(`#appointments-${pageCrn}-${pageUuid}-start`).type(changedStart)
      dateTimePage.getElement(`#appointments-${pageCrn}-${pageUuid}-end`).clear()
      dateTimePage.getElement(`#appointments-${pageCrn}-${pageUuid}-end`).focus().type(changedEnd)
      // Ignore warnings
      dateTimePage.getSubmitBtn().click()
      dateTimePage.getSubmitBtn().click()
      if (!(page instanceof AppointmentCheckYourAnswersPage)) {
        completeTextMessageConfirmationPage({ _crn: crn, _uuid: pageUuid, index: 1 })
        completeSupportingInformationPage(true, '', pageUuid)
      }
      page.checkOnPage()
      page
        .getSummaryListRow(5)
        .find('.govuk-summary-list__value li:nth-child(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          if (normalizedText) {
            expect(normalizedText).to.include(
              `${dateWithYear(newDate.toISODate())} at ${to24HourTimeWithMinutes(changedStart)} to ${to24HourTimeWithMinutes(changedEnd)}`,
            )
          }
        })
    })
  })
}

export const checkUpdateTextMessageConfirmation = (
  page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage,
) => {
  getCrn().then(pageCrn => {
    getUuid().then(pageUuid => {
      page.getSummaryListRow(6).find('.govuk-link').click()
      const textMessageConfirmPage = new TextMessageConfirmationPage()
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${pageCrn}-${pageUuid}-smsOptIn`).should('be.checked')
      textMessageConfirmPage.getSmsOptIn().find(`#appointments-${pageCrn}-${pageUuid}-smsOptIn-3`).click()
      textMessageConfirmPage.getSubmitBtn().click()
      page.checkOnPage()
      page
        .getSummaryListRow(6)
        .find('.govuk-summary-list__value')
        .should('contain.text', 'No')
        .should('not.contain.text', '07783889300')
    })
  })
}

export const checkLogOutcomesAlert = (attendedComplied = false) => {
  it('should render the log outcomes alert banner', () => {
    cy.get('[data-module="serviceAlert"]').as('alert')
    cy.get('@alert')
      .get('.moj-alert__content')
      .should(
        'contain.text',
        !attendedComplied
          ? 'You can only use this service to log attended and complied outcomes.'
          : 'You can only log attended and complied outcomes. If you need to log a different outcome,',
      )
    cy.get('@alert')
      .get('.moj-alert__content a')
      .should(
        'contain.text',
        !attendedComplied
          ? 'Use NDelius to arrange an appointment in the past with another outcome'
          : 'arrange this appointment on NDelius',
      )
      .should(
        'have.attr',
        'href',
        'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=ContactList&CRN=X778160',
      )
      .should('have.attr', 'target', '_blank')
    cy.get('@alert').get('.moj-alert__action button').should('contain.text', 'Dismiss')
  })
}

export const checkUpdateNotes = (
  page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage,
  dateInPast = false,
  sendTextMessage = true,
) => {
  getUuid().then(pageUuid => {
    const index = !dateInPast && sendTextMessage ? 7 : 6
    page.getSummaryListRow(index).find('.govuk-link').click()
    const updatedNotes = 'Some updated notes'
    const notePage = dateInPast ? new AddNotePage() : new AppointmentNotePage()
    notePage.getElement(`#appointments-${crn}-${pageUuid}-notes`).focus().clear().type(updatedNotes)
    notePage.getSubmitBtn().click()
    page.checkOnPage()
    page.getSummaryListRow(index).find('.govuk-summary-list__value').should('contain.text', updatedNotes)
  })
}

export const checkUpdateSensitivity = (
  page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage,
  dateInPast = false,
  sendTextMessage = true,
) => {
  getUuid().then(pageUuid => {
    const index = !dateInPast && sendTextMessage ? 8 : 7
    page.getSummaryListRow(index).find('.govuk-link').click()
    const notePage = dateInPast ? new AddNotePage() : new AppointmentNotePage()
    notePage.getElement(`#appointments-${crn}-${pageUuid}-sensitivity-2`).click()
    notePage.getSubmitBtn().click()
    if (page instanceof ArrangeAnotherAppointmentPage) {
      completeLocationDateTimePage({ index: 1, uuidOveride: pageUuid })
      completeTextMessageConfirmationPage({ _crn: crn, _uuid: pageUuid, index: 1 })
    }
    page.checkOnPage()
    page.getSummaryListRow(index).find('.govuk-summary-list__value').should('contain.text', 'No')
  })
}

export const checkUpdateBackLinkRefresh = (page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage) => {
  const pages = [5, 7]
  cy.wrap(pages).each((index: number) => {
    page.getSummaryListRow(index).find('.govuk-link').click()
    page.getSubmitBtn().click()
    page.getBackLink().click()
    page.checkOnPage()
  })
}

export const checkAppointmentDetails = (
  {
    task,
    withNotesTask,
    noNotesTask,
    withLocationOfficeNameTask,
    deliusManaged = false,
    hasOutcome = false,
    acceptableAbsence = false,
    hasComplied = false,
    hasRarActivity = true,
  }: Args = {} as Args,
) => {
  let page: ManageAppointmentPage
  const manageAppointmentPage = new ManageAppointmentPage()
  let outcomeStatus = ''
  if (hasOutcome && hasComplied) outcomeStatus = 'Complied'
  if (hasOutcome && !hasComplied && !acceptableAbsence) outcomeStatus = 'Unacceptable absence'
  if (hasOutcome && !hasComplied && acceptableAbsence) outcomeStatus = 'Acceptable absence'
  const tagColour = outcomeStatus !== 'Unacceptable absence' ? 'green' : 'red'
  if (!deliusManaged) {
    it('should display the NDelius change links text for MPOP managed appointments', () => {
      manageAppointmentPage
        .getAppointmentDetails()
        .find('.govuk-body')
        .should('contain.text', 'All links to change appointment details on NDelius open in a new tab.')
    })
  } else {
    it('should display the manage appointment on NDelius link', () => {
      manageAppointmentPage
        .getAppointmentDetails()
        .find('.govuk-body a')
        .should('contain.text', 'Manage this appointment on NDelius (opens in a new tab)')
        .should('have.attr', 'target', '_blank')
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    })
  }
  if (deliusManaged && hasOutcome) {
    it('should display the outcome', () => {
      manageAppointmentPage.getAppointmentDetailsListItem(1, 'key').should('contain.text', 'Outcome')
      manageAppointmentPage
        .getAppointmentDetailsListItem(1, 'value')
        .should('contain.html', `<strong class="govuk-tag govuk-tag--${tagColour}`)
        .should('contain.text', outcomeStatus)
      manageAppointmentPage.getAppointmentDetailsListItem(1, 'actions').should('not.exist')
    })
  }
  it('should display the date and time with Reschedule link when date is in past', () => {
    const index = deliusManaged && hasOutcome ? 2 : 1
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Date and time')
    manageAppointmentPage
      .getAppointmentDetailsListItem(index, 'value')
      .should('contain.text', '21 February 2024 at 10:15am to 10:30am')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Reschedule')
        .should('have.attr', 'href', `/case/${crn}/appointment/6/reschedule`)
    } else {
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
    }
  })

  it('should display the full location address', () => {
    const index = deliusManaged && hasOutcome ? 3 : 2
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Location')
    manageAppointmentPage
      .getAppointmentDetailsListItem(index, 'value')
      .should('contain.html', 'The Building<br>77 Some Street<br>Some City Centre<br>London<br>Essex<br>NW10 1EP')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    } else {
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
    }
  })
  if (withLocationOfficeNameTask) {
    it('should display only the office name for the location', () => {
      const index = deliusManaged && hasOutcome ? 3 : 2
      cy.task(withLocationOfficeNameTask)
      cy.visit('/case/X778160/appointments/appointment/6/manage')
      page = new ManageAppointmentPage()
      manageAppointmentPage
        .getAppointmentDetailsListItem(index, 'value')
        .should('contain.text', 'Leamington Probation Office')
    })
  }
  it('should display the attending officer', () => {
    if (task) {
      cy.task(task)
    }
    const index = deliusManaged && hasOutcome ? 4 : 3
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Attending')
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'value').should('contain.text', 'Terry Jones')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    } else {
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
    }
  })
  if (hasRarActivity) {
    it(`should display the RAR activity`, () => {
      cy.task('stubAppointmentUnacceptableAbsenceWithRAR')
      cy.visit('/case/X778160/appointments/appointment/6/manage')
      page = new ManageAppointmentPage()
      manageAppointmentPage.getAppointmentDetailsListItem(5, 'value').should('contain.text', 'Stepping Stones')
    })
  } else {
    it(`should display the RAR activity as 'Not provided'`, () => {
      manageAppointmentPage.getAppointmentDetailsListItem(5, 'key').should('contain.text', 'RAR activity')
      manageAppointmentPage.getAppointmentDetailsListItem(5, 'value').should('contain.text', 'Not provided')
      manageAppointmentPage.getAppointmentDetailsListItem(5, 'actions').should('not.exist')
    })
  }
  it('should display the VISOR report', () => {
    const index = deliusManaged && hasOutcome ? 6 : 5
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'VISOR report')
    manageAppointmentPage.getAppointmentDetailsListItem(index, 'value').should('contain.text', 'No')
    if (!deliusManaged) {
      manageAppointmentPage
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change on NDelius')
        .should('have.attr', 'target', '_blank')
        .should(
          'have.attr',
          'href',
          'https://ndelius-dummy-url/NDelius-war/delius/JSP/deeplink.xhtml?component=UpdateContact&CRN=X778160&contactID=6',
        )
    } else {
      manageAppointmentPage.getAppointmentDetailsListItem(index, 'actions').should('not.exist')
    }
  })
  it('should display the correct values if notes added to appointment', () => {
    const index = deliusManaged && hasOutcome ? 7 : 6
    cy.task(withNotesTask ?? 'stubFutureAppointmentManagedTypeWithNotes')
    cy.visit('/case/X778160/appointments/appointment/6/manage')
    page = new ManageAppointmentPage()
    page.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Appointment notes')
    page
      .getAppointmentDetailsListItem(index, 'value')
      .find('.app-note')
      .eq(0)
      .find('p')
      .eq(0)
      .should('contain.text', 'Some notes')
    page
      .getAppointmentDetailsListItem(index, 'value')
      .find('.app-note')
      .eq(0)
      .find('p')
      .eq(1)
      .should('contain.text', 'Comment added by Terry Jones on 6 April 2023')
    page
      .getAppointmentDetailsListItem(index, 'value')
      .find('.app-note')
      .eq(1)
      .find('p')
      .eq(0)
      .should('contain.text', 'Some more notes')
    page
      .getAppointmentDetailsListItem(index, 'value')
      .find('.app-note')
      .eq(1)
      .find('p')
      .eq(1)
      .should('contain.text', 'Comment added by Terry Jones on 7 April 2023')
    if (!deliusManaged) {
      page
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Add to notes')
        .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
    }
  })

  it('should display the correct values if no notes added to appointment', () => {
    const index = deliusManaged && hasOutcome ? 7 : 6
    cy.task(noNotesTask ?? 'stubFutureAppointmentManagedTypeNoNotes')
    cy.visit('/case/X778160/appointments/appointment/6/manage')
    page = new ManageAppointmentPage()
    page.getAppointmentDetailsListItem(index, 'value').should('contain.text', 'No notes')
    if (!deliusManaged) {
      page
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change')
        .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
    }
  })

  it('should display sensitive', () => {
    const index = deliusManaged && hasOutcome ? 8 : 7
    if (task) {
      cy.task(task)
    }
    cy.visit('/case/X778160/appointments/appointment/6/manage')
    page = new ManageAppointmentPage()
    page.getAppointmentDetailsListItem(index, 'key').should('contain.text', 'Sensitive')
    page.getAppointmentDetailsListItem(index, 'value').should('contain.text', 'No')
    if (!deliusManaged) {
      page
        .getAppointmentDetailsListItem(index, 'actions')
        .find('a')
        .should('contain.text', 'Change')
        .should('have.attr', 'href', `/case/${crn}/appointments/appointment/6/add-note`)
    }
  })
}

export const completeRescheduleAppointmentPage = () => {
  cy.visit('/case/X000001/appointments/appointment/6/manage')
  const manageAppointmentPage = new ManageAppointmentPage()
  manageAppointmentPage.getAppointmentDetailsListItem(1, 'actions').find('a').click()
  getUuid(1).then(pageUuid => {
    const rescheduleAppointmentPage = new RescheduleAppointmentPage()
    rescheduleAppointmentPage
      .getWhoNeedsToReschedule()
      .find('.govuk-radios__item')
      .eq(0)
      .find('.govuk-radios__input')
      .click()
    rescheduleAppointmentPage
      .getElement(`#appointments-X000001-${pageUuid}-rescheduleAppointment-reason`)
      .clear()
      .type('Reschedule reason')
    cy.get('[data-qa="sensitiveInformation"]').find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    rescheduleAppointmentPage.getSubmitBtn().click()
  })
}

export const completeRescheduling = (id: string, inPast = false) => {
  const urlCrn = 'X000001'
  const dateTimePage = new AppointmentLocationDateTimePage()
  const rescheduledStartTime = '09:10'
  const rescheduledEndTime = '10:30'
  let attendedCompliedPage: AttendedCompliedPage
  let addNotePage: AddNotePage
  let supportingInformationPage: AppointmentNotePage
  let textMessageConfirmPage: TextMessageConfirmationPage
  const tomorrow = DateTime.now().plus({ days: 1 })
  const yesterday = DateTime.now().minus({ days: 1 })
  const appointmentDate = inPast ? yesterday : tomorrow
  dateTimePage.getDatePickerInput().clear().type(appointmentDate.toFormat('d/M/yyyy'))
  if (inPast) {
    dateTimePage.getLogOutcomesAlertBanner().should('be.visible')
  }
  dateTimePage.getElementInput(`startTime`).type(rescheduledStartTime)
  dateTimePage.getElementInput(`endTime`).focus().type(rescheduledEndTime)
  dateTimePage.getSubmitBtn().click()
  dateTimePage.getSubmitBtn().click()
  if (inPast) {
    attendedCompliedPage = new AttendedCompliedPage()
    attendedCompliedPage.getLogOutcomesAlertBanner().should('be.visible')
    cy.get('.govuk-checkboxes__input').click()
    attendedCompliedPage.getSubmitBtn().click()
    addNotePage = new AddNotePage()
    cy.get(`#appointments-${urlCrn}-${id}-sensitivity-2`).click()
    addNotePage.getSubmitBtn().click()
  } else {
    textMessageConfirmPage = new TextMessageConfirmationPage()
    textMessageConfirmPage.getSmsOptIn().find(`#appointments-${urlCrn}-${id}-smsOptIn`).click()
    textMessageConfirmPage.getSubmitBtn().click()
    supportingInformationPage = new AppointmentNotePage()
    cy.get(`#appointments-${urlCrn}-${id}-sensitivity-2`).click()
    supportingInformationPage.getSubmitBtn().click()
  }
}

export const to24HourTimeWithMinutes = (time: string): string => {
  const [rawHours, rawMinutes] = time.split(':')

  const hours = Number(rawHours)
  const minutes = Number(rawMinutes)

  const period = hours >= 12 ? 'pm' : 'am'
  const hour12 = hours % 12 || 12

  return `${hour12}:${minutes.toString().padStart(2, '0')}${period}`
}

export const checkRiskToStaffAlert = (_crn = 'X778160', name = 'Alton', riskLevel = 'very high') => {
  cy.get('[data-qa="riskToStaffAlert"]').should('be.visible')
  cy.get('[data-qa="riskToStaffAlert"]').find('h2').should('contain.text', `${name} is ${riskLevel} risk to staff`)
  cy.get('[data-qa="riskToStaffAlert"]')
    .find('a')
    .should('contain.text', `View ${name}'s risk to staff flag`)
    .should('have.attr', 'href', `/case/${_crn}/risk/flag/1`)
}
