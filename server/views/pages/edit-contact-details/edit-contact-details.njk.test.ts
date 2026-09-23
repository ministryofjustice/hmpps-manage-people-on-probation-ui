import * as cheerio from 'cheerio'
import httpMocks from 'node-mocks-http'
import { AppResponse } from '../../../models/Locals'
import { Name, PersonalDetails } from '../../../data/model/personalDetails'
import { createNunjucksTestEnv } from '../../../testutils/nunjucksTestEnv'

const crn = 'X000001'
const appointmentId = '123456'
const id = '31f2fd70-765d-44e8-bfcd-994fb8c43701'

type TestModel = {
  headerPersonName: Name
  personalDetails: Partial<PersonalDetails>
  flags: Record<string, boolean>
  errorMessages: Record<string, string>
  origin: string
  crn: string
  id: string
  showContactAlert: boolean
}

const baseModel: TestModel = {
  headerPersonName: { forename: 'Caroline', surname: 'Wolff' },
  personalDetails: {
    name: { forename: 'Caroline', surname: 'Wolff' },
    mobileNumber: '1234567890',
    telephoneNumber: '',
    email: '',
    allowSms: true,
  },
  flags: {
    enableAllowSms: true,
  },
  errorMessages: {},
  origin: 'allowSms',
  crn,
  id,
  showContactAlert: true,
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
    session: {},
  })
  const res = httpMocks.createResponse({
    locals: input,
  }) as AppResponse
  const env = createNunjucksTestEnv(req, res)
  return cheerio.load(env.render('pages/edit-contact-details/edit-contact-details.njk', input))
}

describe('Edit contact details nunjucks render tests', () => {
  describe('enableAllowSms feature flag is disabled', () => {
    const $ = render({
      flags: {
        enableAllowSms: false,
      },
    } as Partial<TestModel>)
    it('should not display the telephone number', () => {
      expect($('[data-qa=phoneNumber]').length).toBe(0)
    })
    it('should not display the allow sms question', () => {
      expect($('[data-qa=smsOptIn]').length).toBe(0)
    })
    it('should display the correct update alert', () => {
      expect($('[data-qa=updateBanner]').text()).toContain(
        'If you change contact details here, this will update the record in NDelius. The contact details must belong to the person.',
      )
    })
  })
  describe('enableAllowSms feature flag is enabled', () => {
    it('should display the correct update alert', () => {
      const $ = render()
      expect($('[data-qa=updateBanner]').text()).toContain(
        'The contact details must belong to Caroline. Any updates you make here will also update the NDelius record.',
      )
    })
    it('should not display the telephone number', () => {
      const $ = render()
      expect($('[data-qa=phoneNumber]').length).toBe(0)
    })
    it('should display the mobile number', () => {
      const $ = render()
      expect($('[data-qa=mobileNumber]').find('input').val()).toBe(baseModel.personalDetails.mobileNumber)
    })
    it('should  display the allow sms question', () => {
      const $ = render()
      expect($('[data-qa=allowSms]').find('fieldset').find('legend').text()).toContain(
        'Has Caroline given permission to receive text messages on this number? (optional)',
      )
    })
    it('should display the yes radio button as checked if SMS consent is set to true', () => {
      const $ = render()
      expect($('input#allowSms-yes').is(':checked')).toBe(true)
    })
    it('should display the no radio button as checked if SMS consent is set to false', () => {
      const $ = render({
        personalDetails: {
          ...baseModel.personalDetails,
          allowSms: false,
        },
      })
      expect($('input#allowSms-no').is(':checked')).toBe(true)
    })
    it('should not checked either radio button if SMS consent is not defined', () => {
      const $ = render({
        personalDetails: {
          ...baseModel.personalDetails,
          allowSms: undefined,
        },
      })
      expect($('input#allowSms-yes').is(':checked')).toBe(false)
      expect($('input#allowSms-no').is(':checked')).toBe(false)
    })
  })
})
