import ManageAppointmentPage from '../../pages/appointments/manage-appointment.page'
import RescheduleAppointmentPage from '../../pages/appointments/reschedule-appointment.page'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'
import { getUuid } from './imports'

describe('Reschedule Appointment', () => {
  let manageAppointmentPage: ManageAppointmentPage
  let rescheduleAppointmentPage: RescheduleAppointmentPage
  let checkYourAnswerPage: RescheduleCheckYourAnswerPage

  const loadPage = () => {
    cy.visit('/case/X000001/appointments/appointment/6/manage')
    manageAppointmentPage = new ManageAppointmentPage()
    manageAppointmentPage
      .getAppointmentDetailsListItem(1, 'actions')
      .find('a')
      .should('contain.text', 'Reschedule')
      .should('have.attr', 'href', `/case/X000001/appointment/6/reschedule`)
      .click()
    rescheduleAppointmentPage = new RescheduleAppointmentPage()
  }

  beforeEach(() => {
    cy.task('resetMocks')
  })

  it('should render the page', () => {
    loadPage()
    cy.get('.govuk-back-link').should('not.exist')
    cy.get('[data-qa=pageHeading]').should('contain.text', 'Reschedule an appointment')
    cy.get('div[data-qa="whoNeedsToReschedule"] legend').should(
      'contain.text',
      'Who needs to reschedule this appointment',
    )

    cy.get('.govuk-form-group .govuk-hint')
      .eq(0)
      .should(
        'include.text',
        'Appointment: Planned Office Visit (NS) with Terry Jones on 21 February 2024 at 10:15am to 10:30am',
      )

    cy.get('.govuk-form-group .govuk-hint')
      .eq(1)
      .should('contain.text', 'They should give 48 hours notice and provide evidence.')

    cy.get('.govuk-form-group .govuk-hint')
      .eq(2)
      .should('contain.text', 'Includes changes to probation practitioner availability.')
    rescheduleAppointmentPage.getWhoNeedsToReschedule().find('.govuk-radios__item').should('have.length', 2)
    const optionsWho = ['Eula', 'Probation Service']
    for (let i = 0; i < optionsWho.length; i += 1) {
      rescheduleAppointmentPage
        .getWhoNeedsToReschedule()
        .find('.govuk-radios__item')
        .eq(i)
        .find('label')
        .should('contain.text', optionsWho[i])
      rescheduleAppointmentPage
        .getWhoNeedsToReschedule()
        .find('.govuk-radios__item')
        .eq(i)
        .find('.govuk-radios__input')
        .should('not.be.checked')
    }

    rescheduleAppointmentPage.getSubmitBtn().should('contain.text', 'Continue')
    cy.get('.govuk-link').should('contain.text', 'Cancel and go back')
  })

  it('should display validation errors if continue button is clicked without first selecting a reschedule option and sensitivity', () => {
    loadPage()
    getUuid(1).then(uuid => {
      rescheduleAppointmentPage.getSubmitBtn().click()
      rescheduleAppointmentPage.checkErrorSummaryBox([
        'Select who is rescheduling this appointment',
        'Select if contact includes sensitive information',
      ])
      rescheduleAppointmentPage
        .getElement(`#appointments-X000001-${uuid}-rescheduleAppointment-whoNeedsToReschedule-error`)
        .should('contain.text', 'Select who is rescheduling this appointment')
      rescheduleAppointmentPage
        .getElement(`#appointments-X000001-${uuid}-rescheduleAppointment-sensitivity-error`)
        .should('contain.text', 'Select if contact includes sensitive information')
    })
  })

  it('should submit the page successfully if all mandatory option are filled/ selected then continue is clicked', () => {
    loadPage()
    rescheduleAppointmentPage
      .getWhoNeedsToReschedule()
      .find('.govuk-radios__item')
      .eq(0)
      .find('.govuk-radios__input')
      .click()
    cy.get('[data-qa=sensitiveInformation]').find('.govuk-radios__item').eq(0).find('.govuk-radios__input').click()
    rescheduleAppointmentPage.getSubmitBtn().click()
    checkYourAnswerPage = new RescheduleCheckYourAnswerPage()
  })
})
