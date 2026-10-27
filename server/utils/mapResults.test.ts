import { ProbationSearchResponse } from '@ministryofjustice/probation-search-frontend/data/probationSearchClient'
import { mapResults } from './mapResults'
import { ProbationSearchRequest } from '../data/model/search'
import ESupervisionClient from '../data/eSupervisionClient'

const token = 'token-1'
const crn = 'X000001'
jest.mock('../data/eSupervisionClient')
const MockedEsupervisionClient = ESupervisionClient as jest.MockedClass<typeof ESupervisionClient>

describe('mapResults()', () => {
  let onlineCheckInsClient: ESupervisionClient
  beforeEach(() => {
    jest.clearAllMocks()
    MockedEsupervisionClient.prototype.getOffenderCheckinsByCRN.mockResolvedValue(undefined)
    onlineCheckInsClient = new MockedEsupervisionClient(token)
  })

  it('should map providers from response and request', async () => {
    const response = {
      probationAreaAggregations: [
        { code: 'PA1', description: 'Provider 1', count: 2 },
        { code: 'PA2', description: 'Provider 2', count: 5 },
      ],
      content: [{ otherIds: { crn } }],
    } as unknown as ProbationSearchResponse
    const request = {
      providersFilter: ['PA1-Provider 1'],
    } as unknown as ProbationSearchRequest
    const results = await mapResults(response, request, onlineCheckInsClient)
    const expectedProviders = [
      { selected: true, text: 'Provider 1 (2)', value: 'PA1-Provider 1' },
      { selected: false, text: 'Provider 2 (5)', value: 'PA2-Provider 2' },
    ]
    expect(results.providers).toEqual(expectedProviders)
  })
  it('should return query and matchAllTerms from request', async () => {
    const response = {
      content: [{ otherIds: { crn } }],
    } as unknown as ProbationSearchResponse
    const request = {
      query: 'test query',
      matchAllTerms: true,
    } as unknown as ProbationSearchRequest
    const results = await mapResults(response, request, onlineCheckInsClient)
    expect(results.query).toEqual('test query')
    expect(results.matchAllTerms).toEqual(true)
  })
  it('should format date of birth if exists', async () => {
    const response = {
      content: [{ dateOfBirth: '2000-01-01', otherIds: { crn } }],
    } as unknown as ProbationSearchResponse
    const request = {} as unknown as ProbationSearchRequest
    const results = await mapResults(response, request, onlineCheckInsClient)
    expect(results.content[0].formattedDateOfBirth).toEqual('01/01/2000')
  })
  it('should give imageUrl if nomsNumber exists', async () => {
    const response = {
      content: [{ otherIds: { nomsNumber: 'ABC123', crn } }],
    } as unknown as ProbationSearchResponse
    const request = {} as unknown as ProbationSearchRequest
    const results = await mapResults(response, request, onlineCheckInsClient)
    expect(results.content[0].imageUrl).toEqual('/search/prisoner-image/ABC123')
  })
  it('should give NoPhoto imageUrl if nomsNumber does not exist', async () => {
    const response = {
      content: [{ otherIds: { crn } }],
    } as unknown as ProbationSearchResponse
    const request = {} as unknown as ProbationSearchRequest
    const results = await mapResults(response, request, onlineCheckInsClient)
    expect(results.content[0].imageUrl).toEqual('/assets/images/NoPhoto@2x.png')
  })
  it('should give manager details if they exist', async () => {
    const response = {
      content: [
        {
          offenderManagers: [
            {
              active: true,
              staff: { surname: 'Smith', forenames: 'John' },
              probationArea: { description: 'Provider 1' },
            },
          ],
          otherIds: { crn },
        },
      ],
    } as unknown as ProbationSearchResponse
    const request = {} as unknown as ProbationSearchRequest
    const results = await mapResults(response, request, onlineCheckInsClient)
    expect(results.content[0].officer).toEqual('Smith, John')
    expect(results.content[0].provider).toEqual('Provider 1')
  })

  describe('enableESUPCheckInPhotosForSearch', () => {
    it('should call getOffenderCheckinsByCRN and use photoUrl when flag is true and photo exists', async () => {
      const photoUrl = 'http://photo-url'
      MockedEsupervisionClient.prototype.getOffenderCheckinsByCRN.mockResolvedValue({
        uuid: '123',
        crn,
        status: 'VERIFIED',
        firstCheckin: '2023-01-01',
        checkinInterval: 'WEEKLY',
        mode: 'SCHEDULED',
        contactPreference: 'PHONE',
        photoUrl,
      })

      const response = {
        content: [{ otherIds: { crn } }],
      } as unknown as ProbationSearchResponse
      const request = {} as unknown as ProbationSearchRequest

      const results = await mapResults(response, request, onlineCheckInsClient, true)

      expect(onlineCheckInsClient.getOffenderCheckinsByCRN).toHaveBeenCalledWith(crn)
      expect(results.content[0].imageUrl).toEqual(photoUrl)
    })

    it('should NOT call getOffenderCheckinsByCRN when flag is false', async () => {
      const response = {
        content: [{ otherIds: { crn } }],
      } as unknown as ProbationSearchResponse
      const request = {} as unknown as ProbationSearchRequest

      await mapResults(response, request, onlineCheckInsClient, false)

      expect(onlineCheckInsClient.getOffenderCheckinsByCRN).not.toHaveBeenCalled()
    })

    it('should fallback to prisoner image if flag is true but no photoUrl returned', async () => {
      MockedEsupervisionClient.prototype.getOffenderCheckinsByCRN.mockResolvedValue({
        uuid: '123',
        crn,
        status: 'VERIFIED',
        firstCheckin: '2023-01-01',
        checkinInterval: 'WEEKLY',
        mode: 'SCHEDULED',
        contactPreference: 'PHONE',
      })

      const response = {
        content: [{ otherIds: { nomsNumber: 'ABC123', crn } }],
      } as unknown as ProbationSearchResponse
      const request = {} as unknown as ProbationSearchRequest

      const results = await mapResults(response, request, onlineCheckInsClient, true)

      expect(onlineCheckInsClient.getOffenderCheckinsByCRN).toHaveBeenCalledWith(crn)
      expect(results.content[0].imageUrl).toEqual('/search/prisoner-image/ABC123')
    })
  })
})
