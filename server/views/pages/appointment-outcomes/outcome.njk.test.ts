import * as cheerio from 'cheerio'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { Activity, PersonAppointment } from '../../../data/model/schedule'
import { AttendedCompliedAppointment } from '../../../models/Appointments'
import { AppointmentOutcomeProps } from '../../../models/Locals'
import { convertToTitleCase } from '../../../utils'

const env = createNunjucksTestEnv()

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
  return cheerio.load(env.render('pages/appointment-outcomes/outcome.njk', input))
}

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
      // check options
      // check validation errors
      // check redirects
    })
  })
})
