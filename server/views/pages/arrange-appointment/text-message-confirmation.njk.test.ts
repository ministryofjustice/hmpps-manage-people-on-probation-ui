import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { Activity } from '../../../data/model/schedule'
import { AttendedCompliedAppointment } from '../../../models/Appointments'
import { AppointmentOutcomeProps, AppResponse } from '../../../models/Locals'
import { Name, PersonalDetails } from '../../../data/model/personalDetails'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'
import { Option } from '../../../models/Option'
import { SmsPreviewResponse } from '../../../data/model/OutlookEvent'

const crn = 'X000001'
const appointmentId = '123456'
const id = '31f2fd70-765d-44e8-bfcd-994fb8c43701'

const options: Option[] = [
  { text: 'Yes', value: 'YES' },
  { text: 'Yes, update their mobile number', value: 'YES_UPDATE_MOBILE_NUMBER' },
  { text: 'No', value: 'NO' },
]

const overview = [
  'Personal details last updated: 16 October 2025 by Terry Jones',
  'Last text message: delivered on 16 October 2025',
]

const smsPreview: SmsPreviewResponse = {
  englishSmsPreview: 'Dear Caroline',
  welshSmsPreview: null,
}

type TestModel = {
  appointmentOutcome: AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>
  case: Partial<PersonalDetails>
  userLocations: Location[]
  headerPersonName: Name
  headerCRN: string
  flags: Record<string, boolean>
  crn: string
  id: string
}

const baseModel: TestModel = {
  appointmentOutcome: {} as AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>,
  case: {
    name: { forename: 'Caroline', surname: 'Wolff' },
    mobileNumber: '1234567890',
    allowSms: true,
  },
  userLocations: [] as Location[],
  headerPersonName: { forename: 'Caroline', surname: 'Wolff' },
  headerCRN: crn,
  flags: {
    enableAllowSms: true,
  },
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
              date: '2026-05-01',
              start: '09:00',
              user: { locationCode: 'ABC' },
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
  return cheerio.load(env.render('pages/arrange-appointment/text-message-confirmation.njk', input))
}

describe('Text message confirmation nunjucks render tests', () => {
  describe('enableAllowSms feature flag is disabled and pop has mobile number', () => {
    const $ = render({
      flags: {
        enableAllowSms: false,
      },
      smsConfirmationOptions: options,
      smsPreview,
    } as Partial<TestModel>)

    it('should not display the inset text', () => {
      expect($('.govuk-inset-text').length).toBe(0)
    })
    it('should display the correct sms opt-in heading and hint', () => {
      expect($('[data-qa=smsOptIn]').find('legend').text()).toContain(
        'Do you want to send Caroline a text message confirmation?',
      )
      expect($('[data-qa=smsOptIn]').find('.govuk-hint').text()).toContain(
        `Their mobile number is ${baseModel.case.mobileNumber}.`,
      )
    })
    it('should display the correct options', () => {
      expect($('[data-qa=smsOptIn]').find('.govuk-radios').find('.govuk-radios__item').length).toBe(3)
      for (let i = 0; i < 3; i += 1) {
        expect(
          $('[data-qa=smsOptIn]').find('.govuk-radios').find('.govuk-radios__item').eq(i).find('label').text(),
        ).toContain(options[i].text)
      }
    })
    it('should display the SMS preview', () => {
      expect($('[data-qa=smsPreview]').find('h3').text()).toContain('Text message preview')
      expect($('[data-qa=smsPreview]').find('.sms-message-wrapper').text()).toContain(smsPreview.englishSmsPreview)
    })
  })
  describe('enableAllowSms feature flag is disabled and pop does not have mobile number', () => {
    const $ = render({
      flags: {
        enableAllowSms: false,
      },
      case: {
        ...baseModel.case,
        mobileNumber: null,
      },
    } as Partial<TestModel>)

    it('should display the correct sms opt-in heading and hint', () => {
      expect($('[data-qa=smsOptIn]').find('legend').text()).toContain(
        'Do you want to send Caroline a text message confirmation?',
      )
      expect($('[data-qa=smsOptIn]').find('.govuk-hint').text()).toContain(
        `They do not have a mobile number saved, so you´ll need to check if they have one.`,
      )
    })
  })

  describe('enableAllowSms feature flag enabled and pop has a mobile number', () => {
    const $ = render({
      smsConfirmation: {
        overview,
        options,
        preview: smsPreview,
      },
    } as Partial<TestModel>)
    it('should display the overview inset text', () => {
      expect($('.govuk-inset-text').find('li').length).toBe(2)
      for (let i = 0; i < overview.length; i += 1) {
        expect($('.govuk-inset-text').find('li').eq(i).text()).toContain(overview[i])
      }
    })
    it('should display the correct sms opt-in heading and hint', () => {
      expect($('[data-qa=smsOptIn]').find('legend').text()).toContain(
        `Do you want to text Caroline a confirmation on ${baseModel.case.mobileNumber}?`,
      )
      expect($('[data-qa=smsOptIn]').find('.govuk-hint').text()).toContain('Check if Caroline’s number is correct.')
    })
    it('should display the correct options', () => {
      expect($('[data-qa=smsOptIn]').find('.govuk-radios').find('.govuk-radios__item').length).toBe(3)
      for (let i = 0; i < 3; i += 1) {
        expect(
          $('[data-qa=smsOptIn]').find('.govuk-radios').find('.govuk-radios__item').eq(i).find('label').text(),
        ).toContain(options[i].text)
      }
    })
    it('should display the SMS preview', () => {
      expect($('[data-qa=smsPreview]').find('h3').text()).toContain('Text message preview')
      expect($('[data-qa=smsPreview]').find('.sms-message-wrapper').text()).toContain(smsPreview.englishSmsPreview)
    })
  })

  describe('enableAllowSms feature flag enabled and pop does not have a mobile number', () => {
    const $ = render({
      smsConfirmation: {
        overview,
        options,
        preview: smsPreview,
      },
      case: {
        ...baseModel.case,
        mobileNumber: null,
      },
    } as Partial<TestModel>)

    it('should display the correct sms opt-in heading and hint', () => {
      expect($('[data-qa=smsOptIn]').find('legend').text()).toContain(
        'Do you want to send Caroline a text message confirmation?',
      )
      expect($('[data-qa=smsOptIn]').find('.govuk-hint').text()).toContain(
        `They do not have a mobile number saved, so you´ll need to check if they have one.`,
      )
    })
  })
})
