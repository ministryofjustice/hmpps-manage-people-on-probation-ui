import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { Activity, PersonAppointment } from '../../../data/model/schedule'
import { AttendedCompliedAppointment } from '../../../models/Appointments'
import { AppointmentOutcomeProps, AppResponse } from '../../../models/Locals'
import { convertToTitleCase } from '../../../utils'

const crn = 'X000001'
const appointmentId = '123456'

// type Journey = 'MANAGE' | 'ARRANGE' | 'RESCHEDULE'

type TestModel = {
  // Conditions
  // journey: Journey
  // inOffice: boolean
  // dateInPast: boolean
  // Outcome
  appointmentOutcome: AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>
  // check POP header
  headerPersonName?: { forename: string; surname: string }
  headerCRN?: string
  headerDob?: string
  headerTierLink?: string
  // other
  uuid: string
  personAppointment?: PersonAppointment
  crn: string
  backLink: string
}

// {
//   // | Option<AppointmentOutcomeType>[]
//   // | Option<AcceptableAbsenceOutcomeType>[]
//   // | Option<AppointmentEnforcementAction | ''>[]
//   // | Option<EnforcementActionCreatedBy>[]
// }

const baseModel: TestModel = {
  appointmentOutcome: {
    crn,
    id: appointmentId,
    uuid: appointmentId,
    contactId: appointmentId,
    breachOrRecallWarning: {
      title: 'title',
      text: 'text',
      type: 'BREACH', // 'BREACH' | 'RECALL'
    },
    ticket: {
      title: 'title',
      html: 'html',
      type: 'RED', // 'RED' | 'BLUE'
    },
    backLink: 'back',
    isInPast: false, // dateInPast effects
    appointmentHintText: 'hintText',
    options: [
      {
        value: 'ACCEPTABLE_ABSENCE',
        text: 'Acceptable absence',
        hint: { text: 'They provided an acceptable reason or evidence.' },
      },
      {
        value: 'WILL_BE_RESCHEDULED',
        text: 'The appointment will be rescheduled',
      },
    ],
  } as AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>,
  uuid: 'uuid',
  headerPersonName: { forename: 'Alton', surname: 'Berge' },
  crn: 'string',
  backLink: 'string',
}

const render = (model = {} as Partial<TestModel>) => {
  const input = {
    ...baseModel,
    ...model,
    headerPersonName: {
      ...baseModel.headerPersonName,
      ...model.headerPersonName,
    },
    appointmentOutcome: {
      ...baseModel.appointmentOutcome,
      ...model.appointmentOutcome,
    },
  }
  const req = httpMocks.createRequest({
    params: {
      crn,
      id: appointmentId,
      contactId: appointmentId,
    },
    session: {
      data: {},
    },
  })
  const res = httpMocks.createResponse({
    locals: input,
  }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/appointment-outcomes/outcome.njk', input))
}

// const getExpectedOptions = ({ inOffice = true, dateInPast = true }): ExpectedOption<RedirectPages>[] => {
//   const options: ExpectedOption<RedirectPages>[] = []
//   if (dateInPast) {
//     options.push(
//       {
//         value: 'ATTENDED_COMPLIED',
//         text: 'Attended - complied',
//         redirectPageTitle: 'Add a note',
//         RedirectPage: AddNotePage,
//       },
//       {
//         value: 'ATTENDED_FAILED_TO_COMPLY',
//         text: 'Attended - failed to comply',
//         hint: 'For example, they did not follow instructions.',
//         redirectPageTitle: 'Enforcement action for Alton’s failure to comply',
//         RedirectPage: AttendedFailedToComplyPage,
//       },
//     )
//     if (inOffice) {
//       options.push(
//         {
//           value: 'ATTENDED_SENT_HOME_BEHAVIOUR',
//           text: 'Attended - sent home (behaviour)',
//           hint: 'For example, their behaviour was disruptive',
//           redirectPageTitle: 'Enforcement action for Alton’s failure to comply',
//           RedirectPage: AttendedFailedToComplyPage,
//         },
//         {
//           value: 'ATTENDED_SENT_HOME_SERVICE_ISSUES',
//           text: 'Attended - sent home (service issues)',
//           hint: 'For example, the building was unexpectedly closed.',
//           redirectPageTitle: 'Add a note',
//           RedirectPage: AddNotePage,
//         },
//       )
//     }
//   }
//   options.push({
//     value: 'ACCEPTABLE_ABSENCE',
//     text: 'Acceptable absence',
//     hint: 'They provided an acceptable reason or evidence.',
//     redirectPageTitle: 'Why was Alton’s absence acceptable?',
//     RedirectPage: AcceptableAbsencePage,
//   })
//   if (dateInPast) {
//     options.push(
//       {
//         value: 'UNACCEPTABLE_ABSENCE',
//         text: 'Unacceptable absence',
//         hint: 'They did not provide suitable evidence.',
//         redirectPageTitle: 'Enforcement action for Alton’s unacceptable absence',
//         RedirectPage: UnacceptableAbsencePage,
//       },
//       {
//         value: 'FAILED_TO_ATTEND',
//         text: 'Failed to attend',
//         hint: 'You may still need to request and review evidence.',
//         redirectPageTitle: 'Enforcement action for Alton’s absence',
//         RedirectPage: FailedToAttendPage,
//       },
//     )
//   }
//   if (!dateInPast) {
//     options.push({
//       value: 'WILL_BE_RESCHEDULED',
//       text: 'The appointment will be rescheduled',
//       redirectPageTitle: 'Reschedule an appointment',
//       RedirectPage: RescheduleAppointmentPage,
//     })
//   }
//   return options
// }

// export const checkOptions = <TPage extends Page>(options: ExpectedOption<TPage>[], radioGroupIndex = 0): void => {
//   options.forEach(({ value, text, hint }, index) => {
//     cy.get('[data-module="govuk-radios"]')
//       .eq(radioGroupIndex)
//       .find('.govuk-radios__item')
//       .eq(index)
//       .find('label')
//       .should('contain.text', text)
//     if (hint) {
//       cy.get('[data-module="govuk-radios"]')
//         .eq(radioGroupIndex)
//         .find('.govuk-radios__item')
//         .eq(index)
//         .find('.govuk-hint')
//         .should('contain.text', hint)
//     }
//     cy.get('[data-module="govuk-radios"]')
//       .eq(radioGroupIndex)
//       .find(`.govuk-radios__input[value=${value}]`)
//       .should('exist')
//   })
// }

// const checkValidationErrors = ({
//   journey = 'MANAGE',
//   inOffice = true,
//   dateInPast = true,
// }: { journey?: Journey; inOffice?: boolean; dateInPast?: boolean } = {}): void => {
//   const msg = dateInPast ? 'Select an outcome for this appointment' : 'Select why they will not attend this appointment'
//   loadPage({ journey, inOffice, dateInPast })
//   outcomePage = new OutcomePage()
//   outcomePage.getSubmitBtn().click()
//   outcomePage.checkErrorSummaryBox([msg])
//   getUuid(2).then(pageUuid => {
//     const id = journey === 'MANAGE' ? appointmentId : pageUuid
//     cy.get(`#appointments-${crn}-${id}-outcome-outcomeType-error`).should('contain.text', msg)
//   })
// }

describe('Manage appointment journey', () => {
  describe('Appointment is in the past and in office', () => {
    it('should render the page', () => {
      const $ = render({
        appointmentOutcome: {
          isInPast: true,
        } as AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>,
      })

      // check title
      expect($('[data-qa="pageHeading"]').text()).toContain('What was the outcome of this appointment?')
      expect($(`[id="appointments-${crn}-${appointmentId}-outcome-outcomeType-hint"]`).text()).toContain(
        baseModel.appointmentOutcome.appointmentHintText,
      )
      // check options
      // check validation errors
      // check redirects
    })
  })
  describe('Appointment is in the past and not in office', () => {
    it('should render the page', () => {
      const $ = render({
        appointmentOutcome: {
          isInPast: true,
        } as AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>,
      })

      // check title
      expect($('[data-qa="pageHeading"]').text()).toContain('What was the outcome of this appointment?')
      expect($(`[id="appointments-${crn}-${appointmentId}-outcome-outcomeType-hint"]`).text()).toContain(
        baseModel.appointmentOutcome.appointmentHintText,
      )
      // check options
      // check validation errors
      // check redirects
    })
  })
  describe('appointment is in the future', () => {
    it('should render the page', () => {
      const $ = render({
        appointmentOutcome: {
          isInPast: false,
        } as AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>,
      })

      // check title
      expect($('[data-qa="pageHeading"]').text()).toContain(
        `Why will ${convertToTitleCase(baseModel.headerPersonName.forename)} not attend this appointment?`,
      )
      expect($(`[id="appointments-${crn}-${appointmentId}-outcome-outcomeType-hint"]`).text()).toContain(
        baseModel.appointmentOutcome.appointmentHintText,
      )
      // check options
      // check validation errors
      // check redirects
    })
  })
})
