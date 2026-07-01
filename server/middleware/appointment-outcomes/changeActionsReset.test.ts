import httpMocks from 'node-mocks-http'
import { changeActionsReset } from './changeActionsReset'
import { setDataValue } from '../../utils'

const crn = 'X000001'
const id = '12345'

jest.mock('../../utils', () => {
  const actualUtils = jest.requireActual('../../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
  }
})

const setDataValueSpy = setDataValue as jest.MockedFunction<typeof setDataValue>
const nextSpy = jest.fn()

const buildResponse = ({
  sendBreachOrRecallLetter = false,
  reqUrl = '/failed-to-attend',
} = {}): httpMocks.MockResponse<any> => {
  const res = {
    locals: {
      appointmentOutcome: {
        crn,
        id,
        sendBreachOrRecallLetter,
        reqUrl,
      },
    },
  }
  return httpMocks.createResponse(res)
}

describe('middleware/changeActionsReset', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should return next() if change query parameter not set', () => {
    const req = httpMocks.createRequest({ query: {}, session: {} })
    const res = buildResponse({ sendBreachOrRecallLetter: true })
    changeActionsReset(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(setDataValueSpy).not.toHaveBeenCalled()
  })
  it('should return next() if page current url is not an enforcement action page', () => {
    const req = httpMocks.createRequest({ query: { change: '/change/url' }, session: {} })
    const res = buildResponse({ reqUrl: '/outcome/add-note' })
    changeActionsReset(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(setDataValueSpy).not.toHaveBeenCalled()
  })
  it('should return next() if breach/recall initiated action is selected', () => {
    const req = httpMocks.createRequest({ query: { change: '/change/url' }, session: {} })
    const res = buildResponse({ sendBreachOrRecallLetter: true })
    changeActionsReset(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(setDataValueSpy).not.toHaveBeenCalled()
  })
  it('should reset the previously selected actions if change and enforcement action page', () => {
    const req = httpMocks.createRequest({ query: { change: '/change/url' }, session: {} })
    const res = buildResponse()
    changeActionsReset(req, res, nextSpy)
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      1,
      req.session.data,
      ['appointments', crn, id, 'outcome', 'enforcementActionCode'],
      [],
    )
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      2,
      req.session.data,
      ['appointments', crn, id, 'outcome', 'attendedFailedToComply'],
      null,
    )
    expect(setDataValueSpy).toHaveBeenCalledTimes(9)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should reset the previously selected actions if no change and update enforcement action page', () => {
    const req = httpMocks.createRequest({ query: {}, session: {} })
    const res = buildResponse({ reqUrl: '/outcome/update-enforcement-action' })
    changeActionsReset(req, res, nextSpy)
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      1,
      req.session.data,
      ['appointments', crn, id, 'outcome', 'enforcementActionCode'],
      [],
    )
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      2,
      req.session.data,
      ['appointments', crn, id, 'outcome', 'attendedFailedToComply'],
      null,
    )
    expect(setDataValueSpy).toHaveBeenCalledTimes(9)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
