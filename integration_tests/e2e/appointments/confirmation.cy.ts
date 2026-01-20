import { DateTime } from 'luxon'
import { dateWithYear, dayOfWeek } from '../../../server/utils'
import AppointmentConfirmationPage from '../../pages/appointments/confirmation.page'
import RescheduleCheckYourAnswerPage from '../../pages/appointments/reschedule-check-your-answer.page'

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
  completeAttendedCompliedPage,
  completeAddNotePage,
  completeRescheduling,
  completeRescheduleAppointmentPage,
  getUuid,
  completeTextMessageConfirmationPage,
} from './imports'
import OverviewPage from '../../pages/overview'
import YourCasesPage from '../../pages/myCases'

const loadPage = (crnOverride = '', dateInPast = false, completeTextMessageConfirmOptionIndex = 1) => {
  completeSentencePage(1, '', crnOverride)
  completeTypePage(1, false)
  completeLocationDateTimePage({ index: 1, crnOverride, dateInPast })
  if (dateInPast) {
    completeAttendedCompliedPage()
    completeAddNotePage()
  } else {
    completeTextMessageConfirmationPage({ index: completeTextMessageConfirmOptionIndex, _crn: crnOverride })
    completeSupportingInformationPage(true, crnOverride)
  }
  completeCYAPage()
}
describe('Confirmation page', () => {
  let confirmPage: AppointmentConfirmationPage

  const checkRescheduleConfirm = (inPast = false) => {
    const tomorrow = DateTime.now().plus({ days: 1 })
    const yesterday = DateTime.now().minus({ days: 1 })
    checkPopHeader()
    confirmPage.checkPageTitle('Appointment rescheduled')
    cy.get('.govuk-panel__body').find('strong').should('contain.text', 'Planned office visit (NS)')
    const expectedDate = inPast ? yesterday : tomorrow
    cy.get('[data-qa="appointment-date"]')
      .invoke('text')
      .then(text => {
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        expect(normalizedText).to.include(`${dateWithYear(expectedDate.toISODate())} from 9:10am to 10:30am`)
      })
  }
  beforeEach(() => {
    cy.task('resetMocks')
  })
  describe('Appointment arranged in the future', () => {
    beforeEach(() => {
      loadPage()
      confirmPage = new AppointmentConfirmationPage()
    })

    it('should render the page', () => {
      checkPopHeader('Alton Berge', true)
      confirmPage.checkPageTitle('Appointment arranged')
      confirmPage.getPanel().find('strong').should('contain.text', 'Planned office visit (NS)')
      confirmPage
        .getElement('[data-qa="appointment-date"]:nth-of-type(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          expect(normalizedText).to.include(
            `${dayOfWeek(date)} ${dateWithYear(date)} from ${to12HourTime(startTime)} to ${to12HourTime(endTime)}`,
          )
        })
      confirmPage.getWhatHappensNext().find('h2').should('contain.text', 'What happens next')
      confirmPage
        .getWhatHappensNext()
        .find('p:nth-of-type(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          expect(normalizedText).to.include(
            `Alton will receive a confirmation text message with the appointment details. This will also be logged as a contact on NDelius.`,
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
      cy.get('[data-qa="outlook-msg"] li').eq(0).should('contain.text', `Alton`)
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
      loadPage('X000001', false, 2)
      confirmPage = new AppointmentConfirmationPage()
      confirmPage
        .getWhatHappensNext()
        .find('p:nth-of-type(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          expect(normalizedText).to.include(`You need to give Caroline the appointment details.`)
        })
    })
    it('should render the page with no contact numbers', () => {
      cy.task('stubPersonalDetailsNoTelephoneNumbers')
      loadPage('X000001', false, 2)
      confirmPage = new AppointmentConfirmationPage()
      confirmPage.getPopContactNumber().should('not.exist')
      confirmPage
        .getWhatHappensNext()
        .find('p:nth-of-type(1)')
        .invoke('text')
        .then(text => {
          const normalizedText = text.replace(/\s+/g, ' ').trim()
          expect(normalizedText).to.include(`You need to give Caroline the appointment details.`)
        })
    })

    it('should link to the appointment page when practitioner click Return to all cases', () => {
      loadPage()
      cy.get('[data-qa="returnToAllCases"]').click()
      const appointmentsPage = new YourCasesPage()
      appointmentsPage.checkOnPage()
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
            expect(normalizedText).to.include(
              `${dayOfWeek(date)} ${dateWithYear(date)} from ${to12HourTime(startTime)} to ${to12HourTime(endTime)}`,
            )
          })
        confirmPage.getWhatHappensNext().find('h2').should('contain.text', 'What happens next')
        confirmPage
          .getWhatHappensNext()
          .find('p:nth-of-type(1)')
          .invoke('text')
          .then(text => {
            const normalizedText = text.replace(/\s+/g, ' ').trim()
            expect(normalizedText).to.include(
              `Alton will receive a confirmation text message with the appointment details. This will also be logged as a contact on NDelius.`,
            )
          })

        cy.get('[data-qa="outlook-err-msg-1"]').should(
          'contain.text',
          'There is a technical problem with Outlook and we could not send a calendar invitation.',
        )
        cy.get('[data-qa="outlook-err-msg-2"]').should(
          'contain.text',
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
            expect(normalizedText).to.include(
              `${dayOfWeek(date)} ${dateWithYear(date)} from ${to12HourTime(startTime)} to ${to12HourTime(endTime)}`,
            )
          })
        confirmPage.getWhatHappensNext().find('h2').should('contain.text', 'What happens next')
        confirmPage
          .getWhatHappensNext()
          .find('p:nth-of-type(1)')
          .invoke('text')
          .then(text => {
            const normalizedText = text.replace(/\s+/g, ' ').trim()
            expect(normalizedText).to.include(
              `Alton will receive a confirmation text message with the appointment details. This will also be logged as a contact on NDelius.`,
            )
          })

        cy.get('[data-qa="outlook-err-msg-1"]').should(
          'contain.text',
          'There is a technical problem with Outlook and we could not send a calendar invitation.',
        )
        cy.get('[data-qa="outlook-err-msg-2"]').should(
          'contain.text',
          'The appointment has been added to the NDelius contact log and officer diary, along with any supporting information.',
        )

        confirmPage.getSubmitBtn().click()
        const nextAppointmentPage = new OverviewPage()
        nextAppointmentPage.getTab('overview').should('contain.text', 'Overview')
        nextAppointmentPage.checkOnPage()
      })
    })
  })
  describe('Appointment arranged in the past', () => {
    beforeEach(() => {
      const dateInPast = true
      loadPage('', dateInPast)
      confirmPage = new AppointmentConfirmationPage()
    })
    it('should render the page', () => {
      confirmPage.checkPageTitle('Past appointment arranged')
      confirmPage.getPanel().find('strong').should('contain.text', 'Planned office visit (NS)')
      cy.get('[data-qa="what-happens-next"]')
        .find('p')
        .should(
          'contain.text',
          'The appointment has been added to the NDelius contact log and officer diary, along with any supporting information and the outcome.',
        )
    })
  })
  describe('Appointment rescheduled to a date and time in the future', () => {
    let checkYourAnswerPage: RescheduleCheckYourAnswerPage
    beforeEach(() => {
      completeRescheduleAppointmentPage()
    })
    it('should render the confirmation page', () => {
      getUuid().then(uuid => {
        checkYourAnswerPage = new RescheduleCheckYourAnswerPage()
        checkYourAnswerPage.getSubmitBtn().click()
        completeRescheduling(uuid)
        checkYourAnswerPage = new RescheduleCheckYourAnswerPage()
        checkYourAnswerPage.getSubmitBtn().click()
        confirmPage = new AppointmentConfirmationPage()
        checkPopHeader()
        checkRescheduleConfirm()
        cy.get('[data-qa="what-happens-next"]')
          .find('p')
          .eq(0)
          .invoke('text')
          .then(text => {
            const normalizedText = text.replace(/\s+/g, ' ').trim()
            expect(normalizedText).to.include(
              `Caroline will receive a confirmation text message with the appointment details. This will also be logged as a contact on NDelius.`,
            )
          })

        cy.get('[data-qa="what-happens-next"]')
          .find('p')
          .eq(1)
          .should('contain.text', 'The appointment details have been updated on:')
        cy.get('[data-qa="what-happens-next"]')
          .find('ul')
          .find('li')
          .eq(0)
          .should('contain.text', 'Caroline´s calendar')
        cy.get('[data-qa="what-happens-next"]')
          .find('ul')
          .find('li')
          .eq(1)
          .should('contain.text', 'the NDelius contact log and officer diary, along with any supporting information')
      })
    })
  })
  describe('Appointment rescheduled to a date and time in the past', () => {
    let checkYourAnswerPage: RescheduleCheckYourAnswerPage
    beforeEach(() => {
      completeRescheduleAppointmentPage()
    })
    it('should render the confirmation page', () => {
      const inPast = true
      getUuid().then(uuid => {
        checkYourAnswerPage = new RescheduleCheckYourAnswerPage()
        checkYourAnswerPage.getSubmitBtn().click()
        completeRescheduling(uuid, inPast)
        checkYourAnswerPage = new RescheduleCheckYourAnswerPage()
        checkYourAnswerPage.getSubmitBtn().click()
        confirmPage = new AppointmentConfirmationPage()
        cy.get('[data-qa="what-happens-next"]')
          .find('p')
          .eq(0)
          .invoke('text')
          .then(text => {
            const normalizedText = text.replace(/\s+/g, ' ').trim()
            expect(normalizedText).to.include(`You need to give Caroline the appointment details.`)
          })
        cy.get('[data-qa="what-happens-next"]')
          .find('p')
          .eq(1)
          .should(
            'contain.text',
            'The appointment details have been updated on the NDelius contact log and officer diary.',
          )
      })
    })
  })
})

export const to12HourTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number)

  const period = hours >= 12 ? 'pm' : 'am'
  const hour12 = hours % 12 || 12

  if (minutes === 0) {
    return `${hour12}${period}`
  }

  return `${hour12}:${minutes.toString().padStart(2, '0')}${period}`
}
