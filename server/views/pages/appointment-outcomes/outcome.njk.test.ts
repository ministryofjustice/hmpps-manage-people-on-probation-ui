import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { Activity, PersonAppointment } from '../../../data/model/schedule'
import { AcceptableAbsenceOutcomeType, AppointmentEnforcementAction, AppointmentOutcomeType, AttendedCompliedAppointment, EnforcementActionCreatedBy } from '../../../models/Appointments'
import { AppointmentOutcomeProps, AppResponse } from '../../../models/Locals'
import { convertToTitleCase } from '../../../utils'
import { Option } from '../../../models/Option'

const crn = 'X000001'
const appointmentId = '123456'

type TestModel = {
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
    appointmentSession: {
      type: 'Planned Telephone Contact (NS)'
    }
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

const getExpectedOptions = ({ inOffice = true, dateInPast = true }) : Option<AppointmentOutcomeType>[] | Option<AcceptableAbsenceOutcomeType>[] | Option<AppointmentEnforcementAction | ''>[] | Option<EnforcementActionCreatedBy>[] => {
  const options = []
  if (dateInPast) {
    options.push(
      {
        value: 'ATTENDED_COMPLIED',
        text: 'Attended - complied',
      },
      {
        value: 'ATTENDED_FAILED_TO_COMPLY',
        text: 'Attended - failed to comply',
        hint: {
          text: 'For example, they did not follow instructions.',
        },
      },
    )
    if (inOffice) {
      options.push(
        {
          value: 'ATTENDED_SENT_HOME_BEHAVIOUR',
          text: 'Attended - sent home (behaviour)',
          hint: {
            text: 'For example, their behaviour was disruptive',
          },
        },
        {
          value: 'ATTENDED_SENT_HOME_SERVICE_ISSUES',
          text: 'Attended - sent home (service issues)',
          hint: {
            text: 'For example, the building was unexpectedly closed.',
          },
        },
      )
    }
  }
  options.push({
    value: 'ACCEPTABLE_ABSENCE',
    text: 'Acceptable absence',
    hint: {
      text: dateInPast ? 'They provided an acceptable reason or evidence.' : null,
    },
  })
  if (dateInPast) {
    options.push(
      {
        value: 'UNACCEPTABLE_ABSENCE',
        text: 'Unacceptable absence',
        hint: {
          text: 'They did not provide suitable evidence.',
        },
      },
      {
        value: 'FAILED_TO_ATTEND',
        text: 'Failed to attend',
        hint: {
          text: 'You may still need to request and review evidence.',
        },
      },
    )
  }
  if (!dateInPast) {
    options.push({
      value: 'WILL_BE_RESCHEDULED',
      text: 'The appointment will be rescheduled',
    })
  }
  return options as unknown as Option<AppointmentOutcomeType>[] | Option<AcceptableAbsenceOutcomeType>[] | Option<AppointmentEnforcementAction | ''>[] | Option<EnforcementActionCreatedBy>[]
}

const checkPageTitle = (
  $: cheerio.CheerioAPI,
  dateInPast: boolean,
) => {
  const pageTitle = dateInPast
    ? 'What was the outcome of this appointment?'
    : `Why will ${convertToTitleCase(baseModel.headerPersonName.forename)} not attend this appointment?`
  expect($('[data-qa="pageHeading"]').text()).toContain(pageTitle)
  expect($(`[id="appointments-${crn}-${appointmentId}-outcome-outcomeType-hint"]`).text()).toContain(baseModel.appointmentOutcome.appointmentHintText)
}

const checkOptions = ($: cheerio.CheerioAPI, options: Option<AppointmentOutcomeType>[] | Option<AcceptableAbsenceOutcomeType>[] | Option<AppointmentEnforcementAction | ''>[] | Option<EnforcementActionCreatedBy>[]): void => {
  options.forEach(({ value, text, hint }, index) => {
    expect($('[data-module="govuk-radios"]:first').find('.govuk-radios__item').eq(index).find('label').text()).toContain(text)
    if (hint?.text) {
      expect($('[data-module="govuk-radios"]:first').find('.govuk-radios__item').eq(index).find('.govuk-hint').text()).toContain(hint.text)
    }
    expect($('[data-module="govuk-radios"]:first').find(`.govuk-radios__input[value=${value}]`).length).toBeGreaterThan(0)
  })
}

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

let dateInPast : boolean
let inOffice : boolean

const setArgs = (dateInPast: boolean, inOffice: boolean, options: Option<AppointmentOutcomeType>[] | Option<AcceptableAbsenceOutcomeType>[] | Option<AppointmentEnforcementAction | ''>[] | Option<EnforcementActionCreatedBy>[]) => {
  return {
    appointmentOutcome: {
      isInPast: dateInPast,
      appointmentSession: {
        type: inOffice ? 'Planned Office Visit (NS)' : 'Planned Telephone Contact (NS)'
      },
      options: options
    }
  } 
}

describe('Appointment outcome nunjucks render tests', () => {
  describe('Appointment is in the past and in office', () => {
    dateInPast = true
    inOffice = true
    it('should render the page', () => {
      const options = getExpectedOptions({inOffice, dateInPast})
      const $ = render(setArgs(dateInPast, inOffice, options) as unknown as AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>)
      checkPageTitle($, dateInPast)
      checkOptions($, options)
    })
  })
  describe('Appointment is in the past and not in office', () => {
    dateInPast = true
    inOffice = false
    it('should render the page', () => {
      const options = getExpectedOptions({inOffice, dateInPast})
      const $ = render(setArgs(dateInPast, inOffice, options) as unknown as AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>)
      checkPageTitle($, dateInPast)
      checkOptions($, options)
    })
  })
  describe('appointment is in the future', () => {
    dateInPast = false
    inOffice = true
    it('should render the page', () => {
      const options = getExpectedOptions({inOffice, dateInPast})
      const $ = render(setArgs(dateInPast, inOffice, options) as unknown as AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>)
      checkPageTitle($, dateInPast)
      checkOptions($, options)
    })
  })
})

//Covered here:
// - Check title and options based on if appointment inPast / inOffice
// - TODO: basic error message check (do in form nunjucks)

//Still needed for cypress:
// - Access page from arrange journey, manage journey, reschedule journey and check backLink - 3 cases 
// - Check validation if no radios selected (message depends on past or future) - 2 cases (0 new cases)
// - Check where options redirect too (need past and future to cover all) - 2 cases (0 new cases)
// - - inPast and inOffice for most
// - - inFuture for the reschedule option
