import httpMocks from 'node-mocks-http'
import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { getPersonRiskFlags } from './getPersonRiskFlags'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { PersonRiskFlags, RiskFlag } from '../data/model/risk'
import { mockAppResponse } from '../controllers/mocks'

jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const hmppsAuthClient = new HmppsAuthClient(tokenStore)
const mpopComponents = { getPersonRiskFlags: jest.fn() } as unknown as jest.Mocked<MPoPComponents>

const nextSpy = jest.fn()
const crn = 'X000001'

const riskFlag = (overrides: Partial<RiskFlag>): RiskFlag =>
  ({
    id: 1,
    description: 'Risk to Staff',
    level: 'HIGH',
    levelDescription: 'High',
    mostRecentReviewDate: '2026-10-01',
    removed: false,
    removalHistory: [],
    ...overrides,
  }) as RiskFlag

const mockRisks = (overrides: Partial<PersonRiskFlags> = {}): PersonRiskFlags => ({
  personSummary: { name: { forename: 'James', surname: 'Morrison' }, crn, dateOfBirth: '' },
  opd: {},
  mappa: {},
  riskFlags: [
    riskFlag({ id: 1, description: 'Risk to Staff', levelDescription: 'Medium' }),
    riskFlag({ id: 2, description: 'High RoSH', levelDescription: 'High' }),
    riskFlag({ id: 3, description: 'Risk to Probation Staff', level: 'HIGH' }),
  ],
  removedRiskFlags: [riskFlag({ id: 4, description: 'Removed RoSH flag', removed: true })],
  ...overrides,
})

const createRequest = (risks?: PersonRiskFlags) =>
  httpMocks.createRequest({
    params: { crn },
    session: { data: risks ? { risks: { [crn]: risks } } : {} },
  })

const createResponse = ({ enableNDeliusRosh = false } = {}) => mockAppResponse({ flags: { enableNDeliusRosh } })

const apiResponse = (personRiskFlags: PersonRiskFlags | null, httpStatus = 200, error?: Error) => ({
  personRiskFlags,
  httpStatus,
  error,
})

describe('middleware/getPersonRiskFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mpopComponents.getPersonRiskFlags.mockResolvedValue(apiResponse(mockRisks()))
  })

  describe('risks session does not exist for current crn', () => {
    it('requests the risk flags from the api and caches the response in the session', async () => {
      const req = createRequest()
      const res = createResponse()

      await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(req, res, nextSpy)

      expect(mpopComponents.getPersonRiskFlags).toHaveBeenCalledWith(undefined, crn)
      expect(req.session.data.risks[crn]).toEqual(mockRisks())
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })

    it('renames RoSH to ROSH in the risk flags and removed risk flags', async () => {
      const res = createResponse()

      await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(createRequest(), res, nextSpy)

      expect(res.locals.personRisks.riskFlags[1].description).toBe('High ROSH')
      expect(res.locals.personRisks.removedRiskFlags[0].description).toBe('Removed ROSH flag')
    })

    it('clears the level on the Risk to Probation Staff flag', async () => {
      const res = createResponse()

      await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(createRequest(), res, nextSpy)

      expect(res.locals.personRisks.riskFlags[2].level).toBeUndefined()
      expect(res.locals.riskToProbationStaff).toEqual({ id: 3 })
    })

    it('sets the risk badge data', async () => {
      const res = createResponse()

      await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(createRequest(), res, nextSpy)

      expect(res.locals.riskBadgeData.headerBadges.length).toBeGreaterThan(0)
    })

    it('shows the risk flags unavailable error when the api returns a 500', async () => {
      mpopComponents.getPersonRiskFlags.mockResolvedValue(apiResponse(null, 500, new Error('Server error')))
      const req = createRequest()
      const res = createResponse()

      await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(req, res, nextSpy)

      expect(res.locals.personRisks).toEqual({
        errors: [{ text: 'Risk flag information is currently unavailable. Try again later or use NDelius.' }],
      })
      expect(req.session.data.risks).toBeUndefined()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })

    it('throws when the api returns another error', async () => {
      const error = new Error('Service unavailable')
      mpopComponents.getPersonRiskFlags.mockResolvedValue(apiResponse(null, 503, error))

      await expect(
        getPersonRiskFlags(hmppsAuthClient, mpopComponents)(createRequest(), createResponse(), nextSpy),
      ).rejects.toBe(error)
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })

  describe('risks session saved by the previous version of the middleware', () => {
    const legacyRequest = () =>
      httpMocks.createRequest({
        params: { crn },
        session: {
          data: {
            risks: {
              [crn]: mockRisks({
                riskFlags: [riskFlag({ id: 3, description: 'Risk to Probation Staff', level: undefined })],
              }),
            },
            riskBadgeData: { [crn]: { headerBadges: [], groupedBadges: [], remainingCount: 0 } },
          },
        },
      })

    it('requests the risk flags again and replaces the legacy cache', async () => {
      const req = legacyRequest()
      const res = createResponse()

      await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(req, res, nextSpy)

      expect(mpopComponents.getPersonRiskFlags).toHaveBeenCalledWith(undefined, crn)
      expect(req.session.data.risks[crn]).toEqual(mockRisks())
      expect(req.session.data.riskBadgeData[crn]).toBeUndefined()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })

    it('keeps the Risk to Probation Staff badge in the header', async () => {
      const res = createResponse()

      await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(legacyRequest(), res, nextSpy)

      expect(res.locals.riskBadgeData.headerBadges.map((badge: { id: number }) => badge.id)).toContain(3)
    })

    it('uses the refreshed cache on the next request', async () => {
      const req = legacyRequest()
      await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(req, createResponse(), nextSpy)
      await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(req, createResponse(), nextSpy)

      expect(mpopComponents.getPersonRiskFlags).toHaveBeenCalledTimes(1)
    })
  })

  describe('risks session exists for current crn', () => {
    it('uses the session value without calling the api', async () => {
      const res = createResponse()

      await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(
        createRequest(
          mockRisks({ personSummary: { name: { forename: 'Cached', surname: 'Person' }, crn, dateOfBirth: '' } }),
        ),
        res,
        nextSpy,
      )

      expect(mpopComponents.getPersonRiskFlags).not.toHaveBeenCalled()
      expect(res.locals.personRisks.personSummary.name.forename).toBe('Cached')
      expect(res.locals.riskToStaff).toStrictEqual({ id: 1, level: 'MEDIUM' })
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  it('sets the risk to staff level to VERY_HIGH when it is Very High', async () => {
    mpopComponents.getPersonRiskFlags.mockResolvedValue(
      apiResponse(mockRisks({ riskFlags: [riskFlag({ id: 1, levelDescription: 'Very High' })] })),
    )
    const res = createResponse()

    await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(createRequest(), res, nextSpy)

    expect(res.locals.riskToStaff).toStrictEqual({ id: 1, level: 'VERY_HIGH' })
  })

  it('does not set risk badge data when there are no risk flags', async () => {
    mpopComponents.getPersonRiskFlags.mockResolvedValue(apiResponse(mockRisks({ riskFlags: undefined })))
    const res = createResponse()

    await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(createRequest(), res, nextSpy)

    expect(res.locals.riskBadgeData).toBeUndefined()
  })

  it('does not set res.locals.rosh when enableNDeliusRosh is disabled', async () => {
    const res = createResponse()

    await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(createRequest(), res, nextSpy)

    expect(res.locals.rosh).toBeUndefined()
  })

  it('sets the NDelius ROSH level when enableNDeliusRosh is enabled', async () => {
    const res = createResponse({ enableNDeliusRosh: true })

    await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(createRequest(), res, nextSpy)

    expect(res.locals.rosh).toEqual({ level: 'HIGH', assessedOn: '2026-10-01' })
  })

  it('sets a VERY HIGH ROSH level for a Very High ROSH flag', async () => {
    mpopComponents.getPersonRiskFlags.mockResolvedValue(
      apiResponse(mockRisks({ riskFlags: [riskFlag({ id: 1, description: 'Very High RoSH' })] })),
    )
    const res = createResponse({ enableNDeliusRosh: true })

    await getPersonRiskFlags(hmppsAuthClient, mpopComponents)(createRequest(), res, nextSpy)

    expect(res.locals.rosh).toEqual({ level: 'VERY HIGH', assessedOn: '2026-10-01' })
  })

  it('sets the ROSH level to null when there are no risk flags', async () => {
    mpopComponents.getPersonRiskFlags.mockResolvedValue(apiResponse(mockRisks({ riskFlags: undefined })))
    const res = createResponse({ enableNDeliusRosh: true })

    await expect(
      getPersonRiskFlags(hmppsAuthClient, mpopComponents)(createRequest(), res, nextSpy),
    ).resolves.not.toThrow()
    expect(res.locals.rosh).toEqual({ level: null, assessedOn: null })
  })
})
