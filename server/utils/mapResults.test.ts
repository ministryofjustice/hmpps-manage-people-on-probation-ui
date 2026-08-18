import { ProbationSearchResponse } from '@ministryofjustice/probation-search-frontend/data/probationSearchClient'
import { mapResults } from './mapResults'
import { ProbationSearchRequest } from '../data/model/search'

describe('mapResults()', () => {
  it('should map providers from response and request', () => {
    const response = {
      probationAreaAggregations: [
        { code: 'PA1', description: 'Provider 1', count: 2 },
        { code: 'PA2', description: 'Provider 2', count: 5 },
      ],
    } as unknown as ProbationSearchResponse
    const request = {
      providersFilter: ['PA1-Provider 1'],
    } as unknown as ProbationSearchRequest
    const results = mapResults(response, request)
    const expectedProviders = [
      { checked: true, text: 'Provider 1 (2)', value: 'PA1-Provider 1' },
      { checked: false, text: 'Provider 2 (5)', value: 'PA2-Provider 2' },
    ]
    expect(results.providers).toEqual(expectedProviders)
  })
  it('should return query and matchAllTerms from request', () => {
    const response = {} as unknown as ProbationSearchResponse
    const request = {
      query: 'test query',
      matchAllTerms: true,
    } as unknown as ProbationSearchRequest
    const results = mapResults(response, request)
    expect(results.query).toEqual('test query')
    expect(results.matchAllTerms).toEqual(true)
  })
  it('should format date of birth if exists', () => {
    const response = {
      content: [{ dateOfBirth: '2000-01-01' }],
    } as unknown as ProbationSearchResponse
    const request = {} as unknown as ProbationSearchRequest
    const results = mapResults(response, request)
    expect(results.content[0].formattedDateOfBirth).toEqual('01/01/2000')
  })
  it('should give imageUrl if nomsNumber exists', () => {
    const response = {
      content: [{ otherIds: { nomsNumber: 'ABC123' } }],
    } as unknown as ProbationSearchResponse
    const request = {} as unknown as ProbationSearchRequest
    const results = mapResults(response, request)
    expect(results.content[0].imageUrl).toEqual('/search/prisoner-image/ABC123')
  })
  it('should give NoPhoto imageUrl if nomsNumber does not exist', () => {
    const response = {
      content: [{ otherIds: {} }],
    } as unknown as ProbationSearchResponse
    const request = {} as unknown as ProbationSearchRequest
    const results = mapResults(response, request)
    expect(results.content[0].imageUrl).toEqual('/assets/images/NoPhoto@2x.png')
  })
  it('should give manager details if they exist', () => {
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
        },
      ],
    } as unknown as ProbationSearchResponse
    const request = {} as unknown as ProbationSearchRequest
    const results = mapResults(response, request)
    expect(results.content[0].officer).toEqual('Smith, John')
    expect(results.content[0].provider).toEqual('Provider 1')
  })
})
