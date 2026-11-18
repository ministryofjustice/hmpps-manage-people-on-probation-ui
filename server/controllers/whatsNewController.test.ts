import httpMocks from 'node-mocks-http'
import whatsNewController from './whatsNewController'
import TechnicalUpdatesService, { TechnicalUpdate } from '../services/technicalUpdatesService'
import { mockAppResponse } from './mocks'
import { SubjectType } from '../middleware/sendAuditMessage'
import { checkSendAuditMessage } from './testutils'

jest.mock('../services/technicalUpdatesService')
jest.mock('@ministryofjustice/hmpps-audit-client')

describe('whatsNewController', () => {
  const mockTechnicalUpdates: TechnicalUpdate[] = [
    {
      heading: 'Heading 1',
      date: '2025-10-31',
      html: '<p>Update 1</p>',
    },
  ]

  const getTechnicalUpdatesSpy = jest
    .spyOn(TechnicalUpdatesService.prototype, 'getTechnicalUpdates')
    .mockImplementation(() => mockTechnicalUpdates)

  const res = mockAppResponse()
  const renderSpy = jest.spyOn(res, 'render')

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getWhatsNew', () => {
    it('should render the whats-new page with technical updates and guidance link', async () => {
      const req = httpMocks.createRequest({
        headers: {
          referrer: 'http://previous-page',
        },
      })

      const controller = whatsNewController.getWhatsNew()(req, res)
      await controller

      expect(getTechnicalUpdatesSpy).toHaveBeenCalled()
      expect(renderSpy).toHaveBeenCalledWith('pages/whats-new', {
        title: 'New features | Manage people on probation',
        referrer: 'http://previous-page',
        technicalUpdates: mockTechnicalUpdates,
      })
      checkSendAuditMessage(res, 'VIEW_MAS_WHATS_NEW', res.locals.user.username, SubjectType.USER)
    })
  })
})
