import { DateTime } from 'luxon'
import { dateWithYear } from '../../../../server/utils'
import ArrangeAnotherAppointmentPage from '../../../pages/appointments/arrange-another-appointment.page'
import AppointmentCheckYourAnswersPage from '../../../pages/appointments/check-your-answers.page'
import { pastDate, startTime, endTime, date } from './common'
import { to24HourTimeWithMinutes } from '../utils'
import { AppointmentEnforcementAction, AppointmentOutcomeType } from '../../../../server/models/Appointments'

interface SummaryProps {
  page: AppointmentCheckYourAnswersPage | ArrangeAnotherAppointmentPage
  reschedule?: boolean
  anotherAppointment?: boolean
  probationPractitioner?: boolean
  dateInPast?: boolean
  sendTextMessage?: boolean
  summaryHasDate?: boolean
  smsFeatureFlagDisabled?: boolean
  enableNonCompliance?: boolean
  action?: AppointmentEnforcementAction
}

export const checkAppointmentSummary = ({
  page,
  reschedule = false,
  anotherAppointment = false,
  probationPractitioner = false,
  dateInPast = false,
  sendTextMessage = true,
  summaryHasDate = true,
  smsFeatureFlagDisabled = false,
  enableNonCompliance = true,
  action = 'NO_FURTHER_ACTION',
}: SummaryProps) => {
  const appointmentFor = reschedule ? 'Default Sentence Type (12 Months)' : '12 month Community order'
  let attending = 'Deborah Fern (Automated Allocation Team, London)'
  if (anotherAppointment || ((reschedule || anotherAppointment) && probationPractitioner)) {
    attending = 'Peter Parker (PS-PSO) (Automated Allocation Team, London)'
  }
  if (reschedule) {
    attending = 'Terry Jones (PS-PSO) (Automated Allocation Team, London)'
  }

  const location = reschedule
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
  if (!reschedule && !anotherAppointment) {
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
    if (!enableNonCompliance) {
      page.getSummaryListRow(6).find('.govuk-summary-list__key').should('contain.text', 'Attended and complied')
      page.getSummaryListRow(6).find('.govuk-summary-list__value').should('contain.text', 'Yes')
      page.getSummaryListRow(7).find('.govuk-summary-list__key').should('contain.text', 'Notes')
      page.getSummaryListRow(7).find('.govuk-summary-list__value').should('contain.text', 'Some notes')
      page.getSummaryListRow(8).find('.govuk-summary-list__key').should('contain.text', 'Sensitivity')
      page.getSummaryListRow(8).find('.govuk-summary-list__value').should('contain.text', 'Yes')
    }
    if (enableNonCompliance) {
      const evidenceDate = DateTime.now().plus({ days: 6 }).toFormat('dd MMMM yyyy')
      page
        .getSummaryListRow(6)
        .find('.govuk-summary-list__key')
        .should('contain.text', 'What was the outcome of this appointment?')
      page.getSummaryListRow(6).find('.govuk-summary-list__value').should('contain.text', 'Attended - failed to comply')
      page.getSummaryListRow(7).find('.govuk-summary-list__key').should('contain.text', 'Enforcement action')
      const expectedActionHtml =
        action === 'NO_FURTHER_ACTION'
          ? 'No further action'
          : 'I will initiate the breach<br>I will send a licence compliance letter'
      page.getSummaryListRow(7).find('.govuk-summary-list__value').should('contain.html', expectedActionHtml)
      page.getSummaryListRow(8).find('.govuk-summary-list__key').should('contain.text', 'Evidence due date')
      page.getSummaryListRow(8).find('.govuk-summary-list__value').should('contain.text', evidenceDate)
      page.getSummaryListRow(9).find('.govuk-summary-list__key').should('contain.text', 'Notes')
      page.getSummaryListRow(9).find('.govuk-summary-list__value').should('contain.text', 'Some notes')
      page.getSummaryListRow(10).find('.govuk-summary-list__key').should('contain.text', 'Sensitivity')
      page.getSummaryListRow(10).find('.govuk-summary-list__value').should('contain.text', 'Yes')
    }
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
  if (!dateInPast) {
    page
      .getSummaryListRow((!dateInPast && !smsFeatureFlagDisabled ? 7 : 6) + index)
      .find('.govuk-summary-list__key')
      .should('contain.text', 'Supporting information')
    page
      .getSummaryListRow((!dateInPast && !smsFeatureFlagDisabled ? 7 : 6) + index)
      .find('.govuk-summary-list__value')
      .should('contain.text', reschedule || anotherAppointment ? 'Not entered' : 'Some notes')
    page
      .getSummaryListRow((!dateInPast && !smsFeatureFlagDisabled ? 8 : 7) + index)
      .find('.govuk-summary-list__key')
      .should('contain.text', 'Sensitivity')
    page
      .getSummaryListRow((!dateInPast && !smsFeatureFlagDisabled ? 8 : 7) + index)
      .find('.govuk-summary-list__value')
      .should('contain.text', reschedule || anotherAppointment ? 'No' : 'Yes')
  }
}
