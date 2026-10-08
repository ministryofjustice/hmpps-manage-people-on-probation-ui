import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { YesNo } from '../../../models/Appointments'
import { AppointmentLocals, AppResponse } from '../../../models/Locals'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

const crn = 'X000001'
const appointmentId = '123456'
const id = '31f2fd70-765d-44e8-bfcd-994fb8c43701'

const appointment = ({
  textMessageConfirmation = 'Yes',
  allowSms = true,
}: { textMessageConfirmation?: YesNo; allowSms?: boolean } = {}): AppointmentLocals => ({
  meta: {
    isVisor: false,
    forename: 'Caroline',
    change: null,
    userIsAttending: false,
    hasLocation: true,
  },
  type: {
    code: 'COAP',
    description: 'Planned Office Visit (NS)',
    isPersonLevelContact: false,
    isLocationRequired: true,
  },
  visorReport: null,
  appointmentFor: {
    sentence: 'Pre-Sentence',
    requirement: null,
    licenceCondition: null,
    nsi: null,
    forename: null,
    mobileNumber: '07989654824',
  },
  attending: {
    name: 'Deborah Fern (PS - Other)',
    team: 'Automated Allocation Team',
    region: 'London',
    html: 'Deborah Fern (PS - Other) (Automated Allocation Team, London)',
  },
  location: {
    id: 1234,
    code: 'N56NTMC',
    description: 'HMP Wakefield',
    address: {
      buildingNumber: '5',
      streetName: 'Love Lane',
      town: 'Wakefield',
      county: 'West Yorkshire',
      postcode: 'WF2 9AG',
    },
  },
  textMessageConfirmation,
  date: '2026-09-25',
  start: '09:00',
  previousStart: null,
  end: '10:00',
  previousEnd: null,
  notes: '',
  sensitivity: 'No',
  outcomeRecorded: null,
  isReschedule: false,
  allowSms,
})

type TestModel = {
  appointment: AppointmentLocals
  crn: string
  id: string
  contactId: string
  location: string
  url: string
  isInPast: boolean
  sensitivityLocked: boolean
  flags: Record<string, boolean>
}

const baseModel: TestModel = {
  appointment: appointment(),
  crn,
  id,
  contactId: null,
  location: null,
  url: '',
  isInPast: false,
  sensitivityLocked: false,
  flags: {
    enableAllowSms: true,
    enableSmsReminders: true,
  },
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
  return cheerio.load(env.render('pages/arrange-appointment/check-your-answers.njk', input))
}

describe('Check your answers nunjucks render tests', () => {
  describe('Text message confirmation', () => {
    it('should display the text message confirmation row if confirmation answer and sms consent is true', () => {
      const $ = render()
      expect($('[data-text-message-confirmation="true"]').length).toBe(1)
    })

    it('should display the text message confirmation row if confirmation answer and sms consent is undefined', () => {
      const $ = render({
        appointment: {
          ...baseModel.appointment,
          allowSms: undefined,
        },
      })
      expect($('[data-text-message-confirmation="true"]').length).toBe(1)
    })
    it('should not display the text message confirmation row if confirmation answer and sms consent is false', () => {
      const $ = render({
        appointment: {
          ...baseModel.appointment,
          allowSms: false,
        },
      })
      expect($('[data-text-message-confirmation="true"]').length).toBe(0)
    })
    it('should display the the text message confirmation row if answer is YES and enableAllowSms feature flag is disabled', () => {
      const $ = render({
        flags: {
          ...baseModel.flags,
          enableAllowSms: false,
        },
      })
      expect(
        $('.govuk-summary-list .govuk-summary-list__row').eq(5).find('.govuk-summary-list__value').text(),
      ).toContain('Yes')
      expect(
        $('.govuk-summary-list .govuk-summary-list__row').eq(5).find('.govuk-summary-list__value').text(),
      ).toContain('07989654824')
    })
    it('should display the the text message confirmation row if answer is NO and enableAllowSms feature flag is disabled', () => {
      const $ = render({
        appointment: appointment({ textMessageConfirmation: 'No' }),
        flags: {
          ...baseModel.flags,
          enableAllowSms: false,
        },
      })
      expect(
        $('.govuk-summary-list .govuk-summary-list__row').eq(5).find('.govuk-summary-list__value').text(),
      ).toContain('No')
      expect(
        $('.govuk-summary-list .govuk-summary-list__row').eq(5).find('.govuk-summary-list__value').text(),
      ).not.toContain('07989654824')
    })
    it('should display the the text message confirmation row if answer is null and enableAllowSms feature flag is disabled', () => {
      const $ = render({
        appointment: appointment({ textMessageConfirmation: null }),
        flags: {
          ...baseModel.flags,
          enableAllowSms: false,
        },
      })
      expect(
        $('.govuk-summary-list .govuk-summary-list__row').eq(5).find('.govuk-summary-list__value').text(),
      ).toContain('Not entered')
      expect(
        $('.govuk-summary-list .govuk-summary-list__row').eq(5).find('.govuk-summary-list__value').text(),
      ).not.toContain('07989654824')
    })
  })
})
