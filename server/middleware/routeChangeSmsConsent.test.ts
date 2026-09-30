import httpMocks from 'node-mocks-http'
import { routeChangeSmsConsent } from './routeChangeSmsConsent'
import { setDataValue } from '../utils'

const nextSpy = jest.fn()

const res = httpMocks.createResponse()
const spy = jest.spyOn(res, 'redirect')
const crn = 'X000001'
const id = '12345'
const change = '/mock/change/url'

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
  }
})

const setDataValueSpy = setDataValue as jest.MockedFunction<typeof setDataValue>

describe('middleware/routeChangeSmsConsent', () => {
  it('should route to edit contact details page if change link is clicked', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id,
      },
      url: change,
      query: {
        change,
      },
      session: {
        data: {},
      },
      body: {
        appointments: {
          [crn]: {
            [id]: {
              date: '2026-10-01',
              start: '09:00',
              end: '10:00',
              user: {
                locationCode: 'ABC',
              },
            },
          },
        },
      },
    })
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
    expect(spy).toHaveBeenCalledWith(
      `/case/${crn}/personal-details/${id}/edit-contact-details?origin=allowSms&back=${req.url}`,
    )
  })
  it('should call next() if continue button is clicked', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id,
      },
      query: {
        change,
      },
      url: change,
      body: {
        'submit-btn': '',
      },
    })
    routeChangeSmsConsent(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
