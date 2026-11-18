import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { Activity } from '../../../data/model/schedule'
import { AttendedCompliedAppointment } from '../../../models/Appointments'
import { AppointmentOutcomeProps, AppResponse } from '../../../models/Locals'
import { Circumstances, Disabilities, Name, PersonalDetails, Provisions } from '../../../data/model/personalDetails'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

const crn = 'X000001'
const appointmentId = '123456'
const id = '31f2fd70-765d-44e8-bfcd-994fb8c43701'

type TestModel = {
  appointmentOutcome: AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>
  case: Partial<PersonalDetails>
  userLocations: Location[]
  appointment: Record<string, any>
  errorMessages: Record<string, string>
  headerPersonName: Name
  headerCRN: string
  change: string
  flags: Record<string, boolean>
  warningMessages: Record<string, string>
  crn: string
  id: string
  url: string
}

const baseModel: TestModel = {
  appointmentOutcome: {} as AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>,
  case: {
    name: { forename: 'Caroline', surname: 'Wolff' },
    allowSms: true,
    disabilities: {} as Disabilities,
    provisions: {} as Provisions,
    circumstances: {} as Circumstances,
    mobileNumber: '07368448952',
  },
  userLocations: [] as Location[],
  appointment: { type: { isLocationRequired: true } },
  errorMessages: undefined,
  headerPersonName: { forename: 'Caroline', surname: 'Wolff' },
  headerCRN: crn,
  change: '/change/url',
  flags: {
    enableAllowSms: true,
  },
  url: '/page/url',
  warningMessages: {} as any,
  crn,
  id,
}

const render = (model = {} as Partial<TestModel>) => {
  const input = {
    ...baseModel,
    ...model,
  }
  const req = httpMocks.createRequest({
    params: {
      crn,
      id,
      contactId: appointmentId,
    },
    session: {
      data: {
        appointments: {
          [crn]: {
            [id]: {
              eventId: 1,
              type: 'COAP',
            },
          },
        },
        personalDetails: {
          [crn]: {
            allowSms: true,
          },
        },
      },
    },
  })
  const res = httpMocks.createResponse({
    locals: input,
  }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/arrange-appointment/location-date-time.njk', input))
}

const locations = [
  { code: 'HMP', description: 'HMP WAKEFIELD' },
  { code: 'PF', description: '102 PETTY FRANCE' },
  { code: 'TB', description: 'THE BUILDING' },
] as unknown as Location[]

const fieldId = (field: string) => `appointments-${crn}-${id}-${field}`

describe('Location, date and time nunjucks render tests', () => {
  describe('Locations', () => {
    it('should display the user locations, divider and not in list option when location is required', () => {
      const $ = render({ userLocations: locations })
      const options = $('[data-qa="locationOption"]')
      expect(options).toHaveLength(3)
      expect(options.parent().text()).toContain('Hmp Wakefield')
      expect(options.parent().text()).toContain('102 Petty France')
      expect(options.parent().text()).toContain('The Building')
      expect($('.govuk-radios__divider')).toHaveLength(1)
      expect($('input[value="LOCATION_NOT_IN_LIST"]').next('label').text()).toContain(
        'The location I’m looking for is not in this list',
      )
      expect($('input[value="NO_LOCATION_REQUIRED"]')).toHaveLength(0)
    })
    it('should display the no location required option when location is not required', () => {
      const $ = render({ userLocations: locations, appointment: { type: { isLocationRequired: false } } })
      expect($('input[value="NO_LOCATION_REQUIRED"]').next('label').text()).toContain(
        'I do not need to pick a location',
      )
      expect($('.govuk-radios__divider')).toHaveLength(1)
    })
    it('should only display the last 2 options and no divider when there are no locations and location is not required', () => {
      const $ = render({ userLocations: [], appointment: { type: { isLocationRequired: false } } })
      expect($('[data-qa="locationCode"] input[type="radio"]')).toHaveLength(2)
      expect($('[data-qa="locationOption"]')).toHaveLength(0)
      expect($('.govuk-radios__divider')).toHaveLength(0)
      expect($('input[value="LOCATION_NOT_IN_LIST"]')).toHaveLength(1)
      expect($('input[value="NO_LOCATION_REQUIRED"]')).toHaveLength(1)
    })
  })

  describe('Page furniture', () => {
    it('should display the continue button', () => {
      const $ = render()
      expect($('[data-qa="submit-btn"]').text()).toContain('Continue')
    })
    it('should display the date and time inputs', () => {
      const $ = render()
      expect($(`#${fieldId('date')}`)).toHaveLength(1)
      expect($(`#${fieldId('start')}`)).toHaveLength(1)
      expect($(`#${fieldId('end')}`)).toHaveLength(1)
    })
  })

  describe('Back link', () => {
    it('should link to the type attendance page when change is not set', () => {
      const $ = render({ change: undefined })
      expect($('.govuk-back-link').attr('href')).toEqual(
        `/case/${crn}/arrange-appointment/${id}/type-attendance?back=location-date-time`,
      )
    })
    it('should append backPage query when change has no query string', () => {
      const $ = render({ change: '/change/url' })
      expect($('.govuk-back-link').attr('href')).toEqual('/change/url?backPage=cya')
    })
    it('should append backPage as extra param when change has a query string', () => {
      const $ = render({ change: '/change/url?a=b' })
      expect($('.govuk-back-link').attr('href')).toEqual('/change/url?a=b&backPage=cya')
    })
    it('should use change as is when it already contains backPage', () => {
      const $ = render({ change: '/change/url?backPage=cya' })
      expect($('.govuk-back-link').attr('href')).toEqual('/change/url?backPage=cya')
    })
  })

  describe('Circumstances', () => {
    it('should not display the circumstances details when there are none', () => {
      const $ = render()
      expect($('.govuk-details')).toHaveLength(0)
    })
    it('should display the circumstances', () => {
      const $ = render({
        case: {
          ...baseModel.case,
          disabilities: { disabilities: ['Hearing Disabilities', 'Learning Disability'] } as any,
          provisions: { provisions: ['Handrails'] } as any,
          circumstances: {
            circumstances: [
              { type: 'Employment', subType: 'Volunteering' },
              { type: 'Employment', subType: 'Full Time Employed' },
              { type: 'Dependents', subType: 'Has Dependents' },
              { type: 'Relationship', subType: 'Married / Civil partnership' },
            ],
          } as any,
        },
      })
      expect($('.govuk-details__summary-text').text()).toContain('Caroline’s circumstances')
      expect($('[data-qa="disability"] dt').text()).toContain('Disability')
      expect($('[data-qa="disability"] dd').text()).toContain('Hearing Disabilities')
      expect($('[data-qa="disability"] dd').text()).toContain('Learning Disability')
      expect($('[data-qa="provisions"] dt').text()).toContain('Reasonable adjustments')
      expect($('[data-qa="provisions"] dd').text()).toContain('Handrails')
      expect($('[data-qa="employment"] dt').text()).toContain('Employment')
      expect($('[data-qa="employment"] dd').text()).toContain('Volunteering')
      expect($('[data-qa="employment"] dd').text()).toContain('Full Time Employed')
      expect($('[data-qa="dependents"] dt').text()).toContain('Dependents')
      expect($('[data-qa="dependents"] dd').text()).toContain('Has Dependents')
      expect($('[data-qa="relationship"] dt').text()).toContain('Relationship')
      expect($('[data-qa="relationship"] dd').text()).toContain('Married / Civil partnership')
    })
  })

  describe('Warning messages', () => {
    it('should not display any warnings when there are no warning messages', () => {
      const $ = render({ warningMessages: undefined })
      expect($('[data-qa="isWithinOneHourOfMeetingWithWarning"]')).toHaveLength(0)
      expect($('[data-qa="nonWorkingDayNameWarning"]')).toHaveLength(0)
      expect($('[data-qa="overlapsWithMeetingWith"]')).toHaveLength(0)
      expect($('input[name="_warningMessagesSeen"]')).toHaveLength(0)
    })
    it('should display the warnings', () => {
      const $ = render({
        warningMessages: {
          isWithinOneHourOfMeetingWith:
            'Alma Barlow already has an appointment with Alton within an hour of this date and time. Continue with these details or make changes.',
          nonWorkingDayName:
            'You have selected a non-working day (Sunday). Continue with these details or make changes.',
          overlapsWithMeetingWith:
            'Alton has an existing appointment at 11am to 12pm that overlaps with this time. Continue with these details or make changes',
        },
      })
      expect($('input[name="_warningMessagesSeen"]').val()).toEqual('true')
      expect($('[data-qa="isWithinOneHourOfMeetingWithWarning"]').text()).toContain('within an hour of this date')
      expect($('[data-qa="nonWorkingDayNameWarning"]').text()).toContain('non-working day (Sunday)')
      expect($('[data-qa="overlapsWithMeetingWith"]').text()).toContain(
        'Alton has an existing appointment at 11am to 12pm that overlaps with this time.',
      )
    })
  })

  describe('Validation errors', () => {
    it('should display the error summary and messages when nothing is entered', () => {
      const errorMessages = {
        [fieldId('date')]: 'Enter or select a date',
        [fieldId('start')]: 'Enter a start time',
        [fieldId('end')]: 'Enter an end time',
        [fieldId('user-locationCode')]: 'Select an appointment location',
      }
      const $ = render({ errorMessages })
      const summaryLinks = $('[data-qa="errorList"] a')
      expect(summaryLinks.map((_, el) => $(el).text().trim()).get()).toEqual(Object.values(errorMessages))
      expect(summaryLinks.eq(3).attr('href')).toEqual(`#${fieldId('user-locationCode')}`)
      Object.entries(errorMessages).forEach(([key, message]) => {
        expect($(`#${key}-error`).text().trim()).toContain(message)
      })
    })
    it.each([
      ['end time before start time', 'end', 'The end time must be after the start time'],
      ['invalid date', 'date', 'Enter a date in the correct format, for example 17/5/2024'],
      ['date after 2199', 'date', 'The date must not be later than 31/12/2199'],
      [
        'rescheduled date the same as original',
        'date',
        'The original appointment was also arranged for 10:15am on Wednesday 21 February. If the original date is incorrect, select a new date.',
      ],
      [
        'rescheduled start time the same as original',
        'start',
        'The original appointment was also arranged for 10:15am on Wednesday 21 February. If the original date is correct, select a new start time.',
      ],
      [
        'rescheduled end time the same as original',
        'end',
        'The original appointment was also arranged for 10:15am on Wednesday 21 February. If the original date is correct, select a new end time.',
      ],
    ])('should display the %s error', (_, field, message) => {
      const $ = render({ errorMessages: { [fieldId(field)]: message } })
      expect($('[data-qa="errorList"]').text()).toContain(message)
      expect(
        $(`#${fieldId(field)}-error`)
          .text()
          .trim(),
      ).toContain(message)
      expect($('.govuk-back-link')).toHaveLength(1)
    })
  })

  describe('Allow SMS panel', () => {
    it('should not display if enableAllowSms feature flag is disabled', () => {
      const $ = render({
        flags: {
          enableAllowSms: false,
        },
      } as Partial<TestModel>)
      expect($('[data-qa="allowSms"]')).toHaveLength(0)
    })
    it('should not display if enableAllowSms feature flag is enabled and pop does not have mobile number', () => {
      const $ = render({ case: { ...baseModel.case, mobileNumber: null } })
      expect($('[data-qa="allowSms"]')).toHaveLength(0)
    })
    it('should display if enableAllowSms feature flag is enabled and consent is set to true', () => {
      const $ = render()
      expect($('[data-qa="allowSms"]').find(`h3`).text()).toContain(
        'Has Caroline given permission to receive text messages? (optional)',
      )
      expect($('[data-qa="allowSmsHint"]')).toHaveLength(0)
      expect($('[data-qa="allowSmsAnswer"]').text()).toContain('Yes')
      expect($('[data-qa="changeAllowSmsLink"]').text()).toContain('Change')
      expect($('[data-qa="changeAllowSmsLink"]').attr('href')).toContain(
        `/case/${crn}/personal-details/${id}/edit-contact-details?origin=allowSms&back=/page/url`,
      )
    })
    it('should display if enableAllowSms feature flag is enabled and consent is set to false', () => {
      const $ = render({ case: { ...baseModel.case, allowSms: false } })
      expect($('[data-qa="allowSms"]').find(`h3`).text()).toContain(
        'Has Caroline given permission to receive text messages? (optional)',
      )
      expect($('[data-qa="allowSmsHint"]').text()).toContain(
        'You cannot send text message reminders as Caroline has not consented.',
      )
      expect($('[data-qa="allowSmsAnswer"]').text()).toContain('No')
      expect($('[data-qa="changeAllowSmsLink"]').text()).toContain('Change')
      expect($('[data-qa="changeAllowSmsLink"]').attr('href')).toContain(
        `/case/${crn}/personal-details/${id}/edit-contact-details?origin=allowSms&back=/page/url`,
      )
    })
    it('should display if enableAllowSms feature flag is enabled and consent has not been set', () => {
      const $ = render({ case: { ...baseModel.case, allowSms: null } })
      expect($('[data-qa="allowSms"]').find(`h3`).text()).toContain(
        'Has Caroline given permission to receive text messages? (optional)',
      )
      expect($('[data-qa="allowSmsHint"]')).toHaveLength(0)
      expect($('[data-qa="allowSmsAnswer"]').text()).toContain('Not provided')
      expect($('[data-qa="changeAllowSmsLink"]').text()).toContain('Change')
      expect($('[data-qa="changeAllowSmsLink"]').attr('href')).toContain(
        `/case/${crn}/personal-details/${id}/edit-contact-details?origin=allowSms&back=/page/url`,
      )
    })
  })
})
