import httpMocks from 'node-mocks-http'
import { resetEnforcementActionSelection } from './resetEnforcementActionSelection'
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

describe('middleware/resetEnforcementActionSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should return next() if change query parameter not set', () => {
    const req = httpMocks.createRequest({ query: {}, session: {} })
    const res = buildResponse({ sendBreachOrRecallLetter: true })
    resetEnforcementActionSelection(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(setDataValueSpy).not.toHaveBeenCalled()
  })
  it('should return next() if page current url is not an enforcement action page', () => {
    const req = httpMocks.createRequest({ query: { change: '/change/url' }, session: {} })
    const res = buildResponse({ reqUrl: '/outcome/add-note' })
    resetEnforcementActionSelection(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(setDataValueSpy).not.toHaveBeenCalled()
  })
  it('should return next() if breach/recall initiated action is selected', () => {
    const req = httpMocks.createRequest({ query: { change: '/change/url' }, session: {} })
    const res = buildResponse({ sendBreachOrRecallLetter: true })
    resetEnforcementActionSelection(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(setDataValueSpy).not.toHaveBeenCalled()
  })
  it('should reset the previously selected actions if enforcement action page', () => {
    const req = httpMocks.createRequest({ query: { change: '/change/url' }, session: {} })
    const res = buildResponse()
    resetEnforcementActionSelection(req, res, nextSpy)
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      1,
      req.session.data,
      ['appointments', crn, id, 'outcome', 'enforcementActionCode'],
      [],
    )
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      2,
      req.session.data,
      ['appointments', crn, id, 'outcome', 'letterType'],
      null,
    )
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      3,
      req.session.data,
      ['appointments', crn, id, 'outcome', 'letterSentBy'],
      null,
    )
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      4,
      req.session.data,
      ['appointments', crn, id, 'outcome', 'breachNSICreatedBy'],
      null,
    )

    expect(setDataValueSpy).toHaveBeenCalledTimes(4)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should reset the previously selected actions if no change and update enforcement action page', () => {
    const req = httpMocks.createRequest({ query: {}, session: {} })
    const res = buildResponse({ reqUrl: '/outcome/update-enforcement-action' })
    resetEnforcementActionSelection(req, res, nextSpy)
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      1,
      req.session.data,
      ['appointments', crn, id, 'outcome', 'enforcementActionCode'],
      [],
    )
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      2,
      req.session.data,
      ['appointments', crn, id, 'outcome', 'letterType'],
      null,
    )
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      3,
      req.session.data,
      ['appointments', crn, id, 'outcome', 'letterSentBy'],
      null,
    )
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      4,
      req.session.data,
      ['appointments', crn, id, 'outcome', 'breachNSICreatedBy'],
      null,
    )

    expect(setDataValueSpy).toHaveBeenCalledTimes(4)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
