import httpMocks from 'node-mocks-http'
import { routeChangeSmsConsent } from './routeChangeSmsConsent'
import { setDataValue } from '../utils'

const nextSpy = jest.fn()

const res = httpMocks.createResponse()
const spy = jest.spyOn(res, 'redirect')
const crn = 'X000001'
const id = '12345'

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
  }
})

const setDataValueSpy = setDataValue as jest.MockedFunction<typeof setDataValue>

const buildRequest = ({
  query = {},
  body = {},
  date = '1/10/2026',
  start = '09:00',
  end = '10:00',
  locationCode = 'ABC',
} = {}): httpMocks.MockRequest<any> => {
  const req = {
    params: {
      crn,
      id,
    },
    url: `/case/${crn}/arrange-appointment/${id}/location-date-time`,
    query,
    session: {
      data: {},
    },
    body: {
      appointments: {
        [crn]: {
          [id]: {
            date,
            start,
            end,
            user: {
              locationCode,
            },
          },
        },
      },
      ...body,
    },
  }
  return httpMocks.createRequest(req)
}

describe('middleware/routeChangeSmsConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should update the appointment date, start, end and locationCode session and route to edit contact details page if change link is clicked', () => {
    const req = buildRequest()
    routeChangeSmsConsent(req, res, nextSpy)
    expect(nextSpy).not.toHaveBeenCalled()
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      1,
      req.session.data,
      ['appointments', crn, id, 'date'],
      '2026-10-01',
    )
    expect(setDataValueSpy).toHaveBeenNthCalledWith(2, req.session.data, ['appointments', crn, id, 'start'], '09:00')
    expect(setDataValueSpy).toHaveBeenNthCalledWith(3, req.session.data, ['appointments', crn, id, 'end'], '10:00')
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      4,
      req.session.data,
      ['appointments', crn, id, 'user', 'locationCode'],
      'ABC',
    )
    expect(setDataValueSpy).toHaveBeenCalledTimes(4)
    expect(spy).toHaveBeenCalledWith(
      `/case/${crn}/personal-details/${id}/edit-contact-details?origin=allowSms&back=${encodeURIComponent(req.url)}`,
    )
  })
  it('should update the appointment date, start, end and locationCode session and route to edit contact details page if change link is clicked', () => {
    const req = buildRequest({ date: '', start: '', end: '' })
    routeChangeSmsConsent(req, res, nextSpy)
    expect(nextSpy).not.toHaveBeenCalled()
    expect(setDataValueSpy).toHaveBeenNthCalledWith(1, req.session.data, ['appointments', crn, id, 'date'], '')
    expect(setDataValueSpy).toHaveBeenNthCalledWith(2, req.session.data, ['appointments', crn, id, 'start'], '')
    expect(setDataValueSpy).toHaveBeenNthCalledWith(3, req.session.data, ['appointments', crn, id, 'end'], '')
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      4,
      req.session.data,
      ['appointments', crn, id, 'user', 'locationCode'],
      'ABC',
    )
    expect(setDataValueSpy).toHaveBeenCalledTimes(4)
    expect(spy).toHaveBeenCalledWith(
      `/case/${crn}/personal-details/${id}/edit-contact-details?origin=allowSms&back=${encodeURIComponent(req.url)}`,
    )
  })
  it('should update the appointment date, start and end session and route to edit contact details page if change link is clicked', () => {
    const req = buildRequest({ locationCode: null })
    routeChangeSmsConsent(req, res, nextSpy)
    expect(nextSpy).not.toHaveBeenCalled()
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      1,
      req.session.data,
      ['appointments', crn, id, 'date'],
      '2026-10-01',
    )
    expect(setDataValueSpy).toHaveBeenNthCalledWith(2, req.session.data, ['appointments', crn, id, 'start'], '09:00')
    expect(setDataValueSpy).toHaveBeenNthCalledWith(3, req.session.data, ['appointments', crn, id, 'end'], '10:00')
    expect(setDataValueSpy).toHaveBeenCalledTimes(3)
    expect(spy).toHaveBeenCalledWith(
      `/case/${crn}/personal-details/${id}/edit-contact-details?origin=allowSms&back=${encodeURIComponent(req.url)}`,
    )
  })

  it('should call next() if continue button is clicked', () => {
    const req = buildRequest({ body: { 'submit-btn': '' } })

    routeChangeSmsConsent(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
