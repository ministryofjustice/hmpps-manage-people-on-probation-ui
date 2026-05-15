import httpMocks from 'node-mocks-http'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import { mockAppResponse } from './mocks'

jest.mock('uuid', () => ({
  v4: () => 'f1654ea3-0abb-46eb-860b-654a96edbe20',
}))
jest.mock('@ministryofjustice/hmpps-audit-client')
jest.mock('../data/masApiClient')

jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

describe('enforcementContactsController', () => {
  const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
  const crn = 'X123456'
  const username = 'user-1'

  describe('getAllEnforcementContacts', () => {
    it('should render the enforcement actions page with correct data', async () => {
      const req = httpMocks.createRequest({
        params: { crn },
        query: { page: '1' },
        url: '/enforcement-actions',
      })

      const res = mockAppResponse()
      const renderSpy = jest.spyOn(res, 'render')

      const mockEnforcementActions = {
        enforcementContacts: [],
        size: 10,
        page: 0,
        totalResults: 1,
        totalPages: 1,
      }

      const getPersonScheduleSpy = jest
        .spyOn(MasApiClient.prototype, 'getEnforcementContacts')
        .mockResolvedValue(mockEnforcementActions)

      const sendAuditMessageSpy = jest.spyOn(auditService, 'sendAuditMessage')

      await controllers.enforcementActions.getAllEnforcementContacts(hmppsAuthClient)(req, res)

      expect(getPersonScheduleSpy).toHaveBeenCalledWith('user-1', '0')

      expect(sendAuditMessageSpy).toHaveBeenCalledWith({
        action: 'VIEW_MAS_ALL_ENFORCEMENT_ACTIONS',
        who: username,
        subjectId: res.locals.user.username,
        subjectType: 'USER',
        correlationId: 'f1654ea3-0abb-46eb-860b-654a96edbe20',
        service: 'hmpps-manage-people-on-probation-ui',
      })

      expect(renderSpy).toHaveBeenCalledWith(
        'pages/my-enforcement-actions',
        expect.objectContaining({
          enforcementActions: mockEnforcementActions,
          url: encodeURIComponent('/enforcement-actions'),
        }),
      )
    })

    it('should handle missing sort and page parameters', async () => {
      const req = httpMocks.createRequest({
        params: { crn },
        url: '/enforcement-actions',
      })
      const res = mockAppResponse()

      const mockEnforcementActions = {
        totalPages: 0,
        totalResults: 0,
        size: 10,
        content: [],
      }

      const getPersonScheduleSpy = jest
        .spyOn(MasApiClient.prototype, 'getEnforcementContacts')
        .mockResolvedValue(mockEnforcementActions as any)

      await controllers.enforcementActions.getAllEnforcementContacts(hmppsAuthClient)(req, res)

      expect(getPersonScheduleSpy).toHaveBeenCalledWith('user-1', '0')
    })

    it('should handle time sort special case', async () => {
      const req = httpMocks.createRequest({
        params: { crn },
        query: { sortBy: 'time.desc' },
        url: '/enforcement-actions',
      })
      const res = mockAppResponse()

      const getPersonScheduleSpy = jest
        .spyOn(MasApiClient.prototype, 'getEnforcementContacts')
        .mockResolvedValue({} as any)

      await controllers.enforcementActions.getAllEnforcementContacts(hmppsAuthClient)(req, res)

      expect(getPersonScheduleSpy).toHaveBeenCalledWith('user-1', '0')
    })
  })
})
