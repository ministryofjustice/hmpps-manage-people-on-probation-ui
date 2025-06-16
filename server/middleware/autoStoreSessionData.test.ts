import httpMocks from 'node-mocks-http'
import { autoStoreSessionData } from './autoStoreSessionData'
import type { AppResponse } from '../models/Locals'
import { HmppsAuthClient } from '../data'

const crn = 'X778160'
const id = '19a88188-6013-43a7-bb4d-6e338516818f'

const res = {
  locals: {
    user: {
      username: 'user-1',
    },
  },
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

jest.mock('../data/hmppsAuthClient')

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const nextSpy = jest.fn()

describe('/middleware/autoStoreSessionData', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('If no body', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id,
      },
      session: {
        data: {
          appointments: {
            [crn]: {
              [id]: {
                type: 'Home visit',
              },
            },
          },
        },
      },
      body: {
        _csrf: 'z2Oy4ql3-Bdgm83ycXJpIlY8lVV_AyrbAPWE',
      },
    })
    beforeEach(() => {
      autoStoreSessionData(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should', () => {
      expect(req.session.data.appointments[crn][id]).toEqual({ type: 'Home visit' })
    })
  })
  describe('session id already exists', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id,
      },
      session: {
        data: {
          appointments: {
            [crn]: {
              [id]: {
                type: 'Home visit',
              },
            },
          },
        },
      },
      body: {
        _csrf: 'z2Oy4ql3-Bdgm83ycXJpIlY8lVV_AyrbAPWE',
        appointments: {
          [crn]: {
            [id]: {
              date: '13/3/2025',
              'start-time': '9:00am',
              'end-time': '9:30am',
            },
          },
        },
        _minDate: '12/03/2025',
      },
    })
    beforeEach(() => {
      autoStoreSessionData(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should increment the session appointment', () => {
      expect(req.session.data.appointments[crn][id]).toEqual({
        ...req.session.data.appointments[crn][id],
        ...req.body.appointments[crn][id],
        date: '2025-03-13',
      })
    })
    it('should return next', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
  describe('session id does not exist', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id,
      },
      session: {
        data: {
          appointments: {
            X000001: {
              uuid: {
                type: 'Home visit',
              },
            },
          },
        },
      },
      body: {
        _csrf: 'eWgbIYQJ-4cb7KuSKWXvFK87nZ0M3D0RvaPA',
        appointments: {
          [crn]: {
            [id]: {
              sentence: '12 month Community order',
              'sentence-licence-condition': 'Freedom of movement',
            },
          },
        },
      },
    })
    beforeEach(() => {
      autoStoreSessionData(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should create a new appointment session for the id', () => {
      expect(req.session.data.appointments).toEqual({
        ...req.session.data.appointments,
        ...req.body.appointments,
      })
    })
    it('should return next', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
})
