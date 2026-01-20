import httpMocks, { RequestOptions } from 'node-mocks-http'
import validation from '.'
import { mockAppResponse } from '../../controllers/mocks'

const crn = 'X000001'
const id = '1'

const checkInUrl = `/case/${crn}/appointments/${id}/check-in`

const dateFrequencyUrl = `${checkInUrl}/date-frequency`
const contactPreferenceUrl = `${checkInUrl}/contact-preference`
const editContactPreferenceUrl = `${checkInUrl}/edit-contact-preference`
const photoOptionsUrl = `${checkInUrl}/photo-options`
const uploadPhotoUrl = `${checkInUrl}/upload-a-photo`

const manageBase = `/case/${crn}/appointments/check-in/manage/${id}`
const manageSettingsUrl = `${manageBase}/settings`
const manageEditContactUrl = `${manageBase}/edit-contact`
const manageStopCheckinsUrl = `${manageBase}/stop-checkin`
const manageContactUrl = `${manageBase}/contact`

const reqBase = {
  method: 'POST',
  params: { crn, id },
  query: {},
  session: {},
  body: {},
} as RequestOptions

const makeReq = (overrides: Record<string, unknown> = {}) =>
  httpMocks.createRequest(
    JSON.parse(
      JSON.stringify({
        ...reqBase,
        ...overrides,
      }),
    ),
  )

const makeRes = () =>
  mockAppResponse({
    filters: {
      dateFrom: '',
      dateTo: '',
      keywords: '',
    },
  })

describe('Test eSuperVision validation', () => {
  let next: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    next = jest.fn()
  })

  it('passes when url does not match any page', () => {
    const req = makeReq()
    const res = makeRes()
    validation.eSuperVision(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  describe('Test date-frequency', () => {
    it('passes with valid future date and interval', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            checkins: {
              date: '1/12/2099',
              interval: 'WEEKLY',
            },
          },
        },
      }
      const req = makeReq({ url: dateFrequencyUrl, body: { esupervision }, session: { data: { esupervision } } })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('fails when required fields missing', () => {
      const req = makeReq({ url: dateFrequencyUrl, body: { esupervision: {} }, session: { data: {} } })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(res.render).toHaveBeenCalled()
    })
  })

  describe('Test contact-preference (main)', () => {
    it('passes when preferredComs and corresponding contact provided', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            checkins: {
              preferredComs: 'EMAIL',
              checkInEmail: 'test@example.com',
              checkInMobile: '',
            },
          },
        },
      }
      const req = makeReq({
        url: contactPreferenceUrl,
        body: { esupervision, change: 'main', checkInEmail: 'test@example.com', checkInMobile: '' },
        session: { data: { esupervision } },
      })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('fails when no preferredComs selected', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            checkins: {
              preferredComs: '',
              checkInEmail: '',
              checkInMobile: '',
            },
          },
        },
      }
      const req = makeReq({
        url: contactPreferenceUrl,
        body: { esupervision, change: 'main', checkInEmail: '', checkInMobile: '' },
        session: { data: {} },
      })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(res.render).toHaveBeenCalled()
    })
  })

  describe('Test edit-contact-preference', () => {
    it('passes with valid edited email and mobile', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            checkins: {
              editCheckInEmail: 'user@example.com',
              editCheckInMobile: '07123456789',
            },
          },
        },
      }
      const req = makeReq({
        url: editContactPreferenceUrl,
        body: { esupervision },
        session: { data: { esupervision } },
      })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('fails with invalid email/mobile format', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            checkins: {
              editCheckInEmail: 'not-an-email',
              editCheckInMobile: 'abc',
            },
          },
        },
      }
      const req = makeReq({
        url: editContactPreferenceUrl,
        body: { esupervision },
        session: { data: { esupervision } },
      })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(res.render).toHaveBeenCalled()
    })
  })

  describe('Test photo-options', () => {
    it('passes when option is selected', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            checkins: {
              photoUploadOption: 'NOW',
            },
          },
        },
      }
      const req = makeReq({ url: photoOptionsUrl, body: { esupervision }, session: { data: { esupervision } } })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('fails when option not selected', () => {
      const req = makeReq({ url: photoOptionsUrl, body: { esupervision: {} }, session: { data: {} } })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(res.render).toHaveBeenCalled()
    })
  })

  describe('Test upload-a-photo', () => {
    it('passes when photo chosen', () => {
      const esupervision = { [crn]: { [id]: { checkins: {} } } }
      const req = makeReq({
        url: uploadPhotoUrl,
        body: { esupervision, photoUpload: 'file-id' },
        session: { data: { esupervision } },
      })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('fails when photo not chosen', () => {
      const esupervision = { [crn]: { [id]: { checkins: {} } } }
      const req = makeReq({ url: uploadPhotoUrl, body: { esupervision }, session: { data: { esupervision } } })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(res.render).toHaveBeenCalled()
    })
  })

  describe('Test manage settings', () => {
    it('passes with valid future date', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            manageCheckin: {
              date: '1/12/2099',
            },
          },
        },
      }
      const req = makeReq({ url: manageSettingsUrl, body: { esupervision }, session: { data: { esupervision } } })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('fails when date missing', () => {
      const req = makeReq({ url: manageSettingsUrl, body: { esupervision: {} }, session: { data: {} } })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(res.render).toHaveBeenCalled()
    })
  })

  describe('manage edit contact', () => {
    it('passes with valid edited email and mobile', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            manageCheckin: {
              editCheckInEmail: 'user@example.com',
              editCheckInMobile: '07123456789',
            },
          },
        },
      }
      const req = makeReq({ url: manageEditContactUrl, body: { esupervision }, session: { data: { esupervision } } })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('fails with invalid email/mobile', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            manageCheckin: {
              editCheckInEmail: 'invalid',
              editCheckInMobile: '00000',
            },
          },
        },
      }
      const req = makeReq({ url: manageEditContactUrl, body: { esupervision }, session: { data: { esupervision } } })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(res.render).toHaveBeenCalled()
    })
  })

  describe('Test stop-checkin', () => {
    it('passes when stopCheckin is NO', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            manageCheckin: {
              stopCheckin: 'NO',
            },
          },
        },
      }
      const req = makeReq({ url: manageStopCheckinsUrl, body: { esupervision }, session: { data: { esupervision } } })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('passes when stopCheckin is YES with reason provided', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            manageCheckin: {
              stopCheckin: 'YES',
              reason: 'Reason for stopping',
            },
          },
        },
      }
      const req = makeReq({ url: manageStopCheckinsUrl, body: { esupervision }, session: { data: { esupervision } } })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('fails when stopCheckin not selected', () => {
      const req = makeReq({ url: manageStopCheckinsUrl, body: { esupervision: {} }, session: { data: {} } })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(res.render).toHaveBeenCalled()
    })

    it('fails when stopCheckin YES but reason missing', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            manageCheckin: {
              stopCheckin: 'YES',
              reason: '',
            },
          },
        },
      }
      const req = makeReq({ url: manageStopCheckinsUrl, body: { esupervision }, session: { data: { esupervision } } })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(res.render).toHaveBeenCalled()
    })
  })

  describe('Test manage-contact (main)', () => {
    it('passes when preferredComs and corresponding contact provided', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            manageCheckin: {
              preferredComs: 'PHONE',
              checkInEmail: '',
              checkInMobile: '07123456789',
            },
          },
        },
      }
      const req = makeReq({
        url: manageContactUrl,
        body: { esupervision, change: 'main', checkInEmail: '', checkInMobile: '07123456789' },
        session: { data: { esupervision } },
      })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('fails when preferredComs is PHONE but mobile is missing', () => {
      const esupervision = {
        [crn]: {
          [id]: {
            manageCheckin: {
              preferredComs: 'PHONE',
              checkInEmail: '',
              checkInMobile: '',
            },
          },
        },
      }
      const req = makeReq({
        url: manageContactUrl,
        body: { esupervision, change: 'main', checkInEmail: '', checkInMobile: '' },
        session: { data: {} },
      })
      const res = makeRes()
      validation.eSuperVision(req, res, next)
      expect(res.render).toHaveBeenCalled()
    })
  })
})
