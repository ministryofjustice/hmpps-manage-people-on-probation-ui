import CaseSearchService from '@ministryofjustice/probation-search-frontend/service/caseSearchService'
import { getPdu, getManagedBy, services } from './index'
import config from '../config'
import { dataAccess } from '../data'

jest.mock('../config', () => ({
  env: 'test-env',
  buildNumber: '1',
  gitRef: '1234567',
  productId: 'test',
  branchName: 'test',
  apis: {
    hmppsAuth: {
      url: 'http://localhost:8080/auth',
      timeout: { response: 1000, deadline: 1000 },
    },
    arnsApi: {
      url: 'http://localhost:8080/arns',
      timeout: { response: 1000, deadline: 1000 },
    },
  },
  redis: {
    enabled: false,
  },
}))
jest.mock('../data')
jest.mock('@ministryofjustice/probation-search-frontend/service/caseSearchService')

describe('Probation search component extra columns:Managed by and PDU', () => {
  describe('getPdu', () => {
    it('should return the PDU description in title case if an active manager is found', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            team: {
              borough: {
                description: 'test borough',
              },
            },
          },
        ],
      }
      expect(getPdu(result)).toBe('Test Borough')
    })

    it('should return "Unallocated" if no active manager is found', () => {
      const result = {
        offenderManagers: [
          {
            active: false,
            team: {
              borough: {
                description: 'test borough',
              },
            },
          },
        ],
      }
      expect(getPdu(result)).toBe('Unallocated')
    })

    it('should return "Unallocated" if active manager has no borough description', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            team: {
              borough: {},
            },
          },
        ],
      }
      expect(getPdu(result)).toBe('Unallocated')
    })

    it('should return "Unallocated" if active manager has no borough description as Unallocated', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            team: {
              borough: { code: 'N03UAT', description: 'Unallocated Level 2(N03)' },
            },
          },
        ],
      }
      expect(getPdu(result)).toBe('Unallocated')
    })

    it('should handle null/undefined results gracefully', () => {
      expect(getPdu(null)).toBe('Unallocated')
      expect(getPdu({})).toBe('Unallocated')
    })
  })

  describe('getManagedBy', () => {
    it('should return the staff name and borough in title case if an active manager is found', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            staff: {
              forenames: 'PACOCHA',
              surname: 'LEIGH',
            },
            team: {
              borough: {
                description: 'Unallocated Level 2(N03)',
              },
            },
          },
        ],
      }
      expect(getManagedBy(result)).toBe('Pacocha Leigh')
    })

    it('should return only the staff name if borough description is missing', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            staff: {
              forenames: 'JOHN',
              surname: 'SMITH',
            },
            team: {
              borough: {},
            },
          },
        ],
      }
      expect(getManagedBy(result)).toBe('John Smith')
    })

    it('should return "Unallocated" if no active manager is found', () => {
      const result = {
        offenderManagers: [
          {
            active: false,
          },
        ],
      }
      expect(getManagedBy(result)).toBe('Unallocated')
    })

    it('should return "Unallocated" if the active manager staff is marked as unallocated', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            staff: {
              unallocated: true,
            },
          },
        ],
      }
      expect(getManagedBy(result)).toBe('Unallocated')
    })

    it('should handle missing staff names gracefully', () => {
      const result = {
        offenderManagers: [
          {
            active: true,
            team: {
              borough: {
                description: 'test borough',
              },
            },
          },
        ],
      }
      expect(getManagedBy(result)).toBe('')
    })

    it('should handle null/undefined results gracefully', () => {
      expect(getManagedBy(null)).toBe('Unallocated')
      expect(getManagedBy({})).toBe('Unallocated')
    })
  })

  describe('Test services', () => {
    const dataAccessMock = dataAccess as jest.Mock
    const CaseSearchServiceMock = CaseSearchService as jest.Mock

    it('should initialize CaseSearchService with correct parameters', () => {
      const hmppsAuthClient = {}
      dataAccessMock.mockReturnValue({
        hmppsAuthClient,
        applicationInfo: {},
        manageUsersApiClient: {},
        probationFrontendComponentsApiClient: {},
        arnsComponents: {},
      })

      const result = services()

      expect(CaseSearchServiceMock).toHaveBeenCalledWith({
        oauthClient: hmppsAuthClient,
        environment: config.env,
        extraColumns: [
          {
            header: 'Managed by',
            value: expect.any(Function),
          },
          {
            header: 'PDU',
            value: expect.any(Function),
          },
        ],
      })
      expect(result.searchService).toBeInstanceOf(CaseSearchService)
      expect(result.searchServiceWithoutExtraColumns).toBeInstanceOf(CaseSearchService)

      expect(CaseSearchServiceMock).toHaveBeenCalledWith({
        oauthClient: hmppsAuthClient,
        environment: config.env,
        extraColumns: [],
      })
    })

    it('should correctly configure extraColumns value functions', () => {
      dataAccessMock.mockReturnValue({
        hmppsAuthClient: {},
        applicationInfo: {},
        manageUsersApiClient: {},
        probationFrontendComponentsApiClient: {},
        arnsComponents: {},
      })

      services()

      const { extraColumns } = CaseSearchServiceMock.mock.calls[0][0]
      const managedByColumn = extraColumns.find((c: any) => c.header === 'Managed by')
      const pduColumn = extraColumns.find((c: any) => c.header === 'PDU')

      const record = { offenderManagers: [{ active: true, staff: { forenames: 'John', surname: 'Smith' } }] }
      expect(managedByColumn.value(record)).toBe('John Smith')

      const pduRecord = {
        offenderManagers: [{ active: true, team: { borough: { description: 'test borough' } } }],
      }
      expect(pduColumn.value(pduRecord)).toBe('Test Borough')
    })
  })
})
