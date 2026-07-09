import httpMocks from 'node-mocks-http'
import { AppResponse } from '../models/Locals'
import { dismissAlert } from './dismissAlert'

describe('/middleware/dismissAlert', () => {
  const req = httpMocks.createRequest({
    session: { alertDismissed: false },
  })
  const res = {
    locals: {
      user: {
        username: 'user-1',
      },
    },
    json: jest.fn().mockReturnThis(),
  } as unknown as AppResponse

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Alert dismissed', () => {
    beforeEach(async () => {
      dismissAlert(req, res)
    })
    it('should update the session when alert is dismissed', () => {
      expect(req.session.alertDismissed).toBe(true)
    })
    it('should return success true', () => {
      expect(res.json).toHaveBeenCalledWith({ success: true })
    })
  })
})
