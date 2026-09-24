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
  headerPersonName: Name
  headerCRN: string
  change: string
  flags: Record<string, boolean>
  warningMessages: Record<string, string>
  crn: string
  id: string
}

const baseModel: TestModel = {
  appointmentOutcome: {} as AppointmentOutcomeProps<AttendedCompliedAppointment | Activity>,
  case: {
    name: { forename: 'Caroline', surname: 'Wolff' },
    allowSms: true,
    disabilities: {} as Disabilities,
    provisions: {} as Provisions,
    circumstances: {} as Circumstances,
  },
  userLocations: [] as Location[],
  headerPersonName: { forename: 'Caroline', surname: 'Wolff' },
  headerCRN: crn,
  change: '/change/url',
  flags: {
    enableAllowSms: true,
  },
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

describe('Location, date and time nunjucks render tests', () => {
  describe('Allow SMS panel', () => {
    it('should not display if enableAllowSms feature flag is disabled', () => {
      const $ = render({
        flags: {
          enableAllowSms: false,
        },
      } as Partial<TestModel>)
      expect($('[data-qa="allowSms"]').length).toBe(0)
    })
    it('should display if enableAllowSms feature flag is enabled and consent is set to true', () => {
      const $ = render()
      expect($('[data-qa="allowSms"]').find(`h3`).text()).toContain(
        'Has Caroline given permission to receive text messages? (optional)',
      )
      expect($('[data-qa="allowSmsHint"]').length).toBe(0)
      expect($('[data-qa="allowSmsAnswer"]').text()).toContain('Yes')
      expect($('[data-qa="changeAllowSmsLink"]').text()).toContain('Change')
      expect($('[data-qa="changeAllowSmsLink"]').attr('href')).toContain(
        `/case/${crn}/personal-details/${id}/edit-contact-details?origin=allowSms&change=/case/${crn}/arrange-appointment/${id}/location-date-time`,
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
        `/case/${crn}/personal-details/${id}/edit-contact-details?origin=allowSms&change=/case/${crn}/arrange-appointment/${id}/location-date-time`,
      )
    })
    it('should display if enableAllowSms feature flag is enabled and consent has not been set', () => {
      const $ = render({ case: { ...baseModel.case, allowSms: null } })
      expect($('[data-qa="allowSms"]').find(`h3`).text()).toContain(
        'Has Caroline given permission to receive text messages? (optional)',
      )
      expect($('[data-qa="allowSmsHint"]').length).toBe(0)
      expect($('[data-qa="allowSmsAnswer"]').text()).toContain('Not provided')
      expect($('[data-qa="changeAllowSmsLink"]').text()).toContain('Change')
      expect($('[data-qa="changeAllowSmsLink"]').attr('href')).toContain(
        `/case/${crn}/personal-details/${id}/edit-contact-details?origin=allowSms&change=/case/${crn}/arrange-appointment/${id}/location-date-time`,
      )
    })
  })
})
