import httpMocks from 'node-mocks-http'
import { DateTime } from 'luxon'
import { AppResponse } from '../models/Locals'
import { checkIsInPast } from './isInPast'

describe('/middleware/checkIsInPast', () => {
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

  const now = DateTime.now()
  const tomorrow = now.plus({ days: 1 })
  const dateString = tomorrow.toFormat('yyyy-M-d')

  describe('Date is in the past', () => {
    beforeEach(async () => {
      const req = httpMocks.createRequest({
        session: { alertDismissed: false },
        body: { date: dateString, time: '12:00' },
      })
      checkIsInPast(req, res)
    })
    it('should return success true', () => {
      expect(res.json).toHaveBeenCalledWith({ isInPast: false, isToday: false, alertDismissed: false })
    })
  })
})
