import httpMocks from 'node-mocks-http'
import { isValidCrn, isValidUUID } from '../utils'
import HmppsAuthClient from '../data/hmppsAuthClient'
import ESupervisionClient from '../data/eSupervisionClient'
import { getCheckInQuestionsRedirect } from './getCheckInQuestionsRedirect'
import { mockAppResponse } from '../controllers/mocks'
import { renderError } from './renderError'

jest.mock('../../logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}))

jest.mock('../middleware/postCheckInDetails', () => ({
  postCheckInDetails: jest.fn(
    () => (req: any, res: any) =>
      Promise.resolve({
        setup: { id: 'setup-1' },
        uploadLocation: 's3://bucket/key',
      }),
  ),
}))

jest.mock('../data/masApiClient')
jest.mock('../data/eSupervisionClient')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('@ministryofjustice/hmpps-audit-client')

const mockMiddlewareFn = jest.fn()
jest.mock('./renderError', () => ({
  renderError: jest.fn(() => mockMiddlewareFn),
}))

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidCrn: jest.fn(),
    isValidUUID: jest.fn(),
    setDataValue: jest.fn(),
  }
})

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))

jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

const mockGetUpcomingCheckinQuestions = jest
  .spyOn(ESupervisionClient.prototype, 'getUpcomingCheckinQuestions')
  .mockImplementation(async () => null)

const mockIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockIsValidUUID = isValidUUID as jest.MockedFunction<typeof isValidUUID>
const mockRenderError = renderError as jest.MockedFunction<typeof renderError>

const crn = 'X000001'
const uuid = 'f1654ea3-0abb-46eb-860b-654a96edbe20'

const res = mockAppResponse()
const redirectSpy = jest.spyOn(res, 'redirect')
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>

describe('getCheckInQuestionsRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsValidCrn.mockReturnValue(true)
    mockIsValidUUID.mockReturnValue(true)
  })

  it('renders 404 if CRN or ID is invalid', async () => {
    mockIsValidCrn.mockReturnValue(false)
    const req = httpMocks.createRequest({ params: { crn, id: uuid } })
    const nextSpy = jest.fn()

    await getCheckInQuestionsRedirect(hmppsAuthClient)(req, res, nextSpy)

    expect(mockRenderError).toHaveBeenCalledWith(404)
    expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
    expect(nextSpy).not.toHaveBeenCalled()
  })

  it('calls next when the check in date is strictly in the future', async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    mockGetUpcomingCheckinQuestions.mockResolvedValue({
      expectedCheckinDate: futureDate.toISOString(),
      questions: [],
    })

    const req = httpMocks.createRequest({ params: { crn, id: uuid } })
    const nextSpy = jest.fn()

    await getCheckInQuestionsRedirect(hmppsAuthClient)(req, res, nextSpy)

    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(redirectSpy).not.toHaveBeenCalled()
  })

  it('redirects to manage page when the check in is today', async () => {
    const today = new Date()
    mockGetUpcomingCheckinQuestions.mockResolvedValue({
      expectedCheckinDate: today.toISOString(),
      questions: [],
    })

    const req = httpMocks.createRequest({ params: { crn, id: uuid } })
    const nextSpy = jest.fn()

    await getCheckInQuestionsRedirect(hmppsAuthClient)(req, res, nextSpy)

    expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/check-in/manage/${uuid}`)
    expect(nextSpy).not.toHaveBeenCalled()
  })

  it('redirects to manage page when the check in is in the past', async () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 2)
    mockGetUpcomingCheckinQuestions.mockResolvedValue({
      expectedCheckinDate: pastDate.toISOString(),
      questions: [],
    })

    const req = httpMocks.createRequest({ params: { crn, id: uuid } })
    const nextSpy = jest.fn()

    await getCheckInQuestionsRedirect(hmppsAuthClient)(req, res, nextSpy)

    expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/check-in/manage/${uuid}`)
    expect(nextSpy).not.toHaveBeenCalled()
  })

  it('redirects to manage page when the API returns null', async () => {
    mockGetUpcomingCheckinQuestions.mockResolvedValue(null)

    const req = httpMocks.createRequest({ params: { crn, id: uuid } })
    const nextSpy = jest.fn()

    await getCheckInQuestionsRedirect(hmppsAuthClient)(req, res, nextSpy)

    expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/check-in/manage/${uuid}`)
    expect(nextSpy).not.toHaveBeenCalled()
  })
})
