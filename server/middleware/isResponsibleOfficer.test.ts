import httpMocks from 'node-mocks-http'
import { isResponsibleOfficer } from './isResponsibleOfficer'
import { HmppsAuthClient } from '../data'
import MasApiClient from '../data/masApiClient'
import { AppResponse } from '../models/Locals'
import { ProbationPractitioner } from '../models/CaseDetail'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/masApiClient')

describe('isResponsibleOfficer middleware', () => {
  const crn = 'X123456'
  const username = 'USER1'
  const token = 'system-client-token'

  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let req: httpMocks.MockRequest<any>
  let res: AppResponse
  let next: jest.Mock

  beforeEach(() => {
    hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
    jest.spyOn(hmppsAuthClient, 'getSystemClientToken').mockImplementation(() => Promise.resolve(token))

    req = httpMocks.createRequest({
      params: { crn },
    })

    res = {
      locals: {
        user: { username },
      },
    } as unknown as AppResponse

    next = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return true and set locals when the user is the responsible officer', async () => {
    const pp: ProbationPractitioner = {
      code: 'ST001',
      name: { forename: 'John', surname: 'Doe' },
      username: 'USER1',
      provider: { code: 'P1', name: 'Provider 1' },
      team: { code: 'T1', description: 'Team 1' },
      unallocated: false,
    }

    const getProbationPractitionerSpy = jest
      .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
      .mockImplementation(() => Promise.resolve(pp))

    const result = await isResponsibleOfficer(hmppsAuthClient)(req, res, next)

    expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith(username)
    expect(getProbationPractitionerSpy).toHaveBeenCalledWith(crn)
    expect(res.locals.isResponsibleOfficer).toBe(true)
    expect(res.locals.responsibleOfficerForename).toBe('John')
    expect(res.locals.responsibleOfficerSurname).toBe('Doe')
    expect(result).toBe(true)
  })

  it('should return false and set locals when the user is not the responsible officer', async () => {
    const pp: ProbationPractitioner = {
      code: 'ST002',
      name: { forename: 'Jane', surname: 'Smith' },
      username: 'USER2',
      provider: { code: 'P1', name: 'Provider 1' },
      team: { code: 'T1', description: 'Team 1' },
      unallocated: false,
    }

    const getProbationPractitionerSpy = jest
      .spyOn(MasApiClient.prototype, 'getProbationPractitioner')
      .mockImplementation(() => Promise.resolve(pp))

    const result = await isResponsibleOfficer(hmppsAuthClient)(req, res, next)

    expect(getProbationPractitionerSpy).toHaveBeenCalledWith(crn)
    expect(res.locals.isResponsibleOfficer).toBe(false)
    expect(res.locals.responsibleOfficerForename).toBe('Jane')
    expect(res.locals.responsibleOfficerSurname).toBe('Smith')
    expect(result).toBe(false)
  })

  it('should handle case insensitivity for username comparison', async () => {
    const pp: ProbationPractitioner = {
      code: 'ST001',
      name: { forename: 'John', surname: 'Doe' },
      username: 'user1', // lower case
      provider: { code: 'P1', name: 'Provider 1' },
      team: { code: 'T1', description: 'Team 1' },
      unallocated: false,
    }

    jest.spyOn(MasApiClient.prototype, 'getProbationPractitioner').mockImplementation(() => Promise.resolve(pp))

    const result = await isResponsibleOfficer(hmppsAuthClient)(req, res, next)

    expect(res.locals.isResponsibleOfficer).toBe(true)
    expect(result).toBe(true)
  })
})
