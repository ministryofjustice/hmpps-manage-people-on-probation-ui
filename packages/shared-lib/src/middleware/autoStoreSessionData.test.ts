import httpMocks from 'node-mocks-http'
import { autoStoreSessionData } from './autoStoreSessionData'
import type { AppResponse } from '../models/Locals'
import { HmppsAuthClient } from '../data'
import { getConfig } from '../config'

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

jest.mock('../applicationInfo', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    applicationName: 'manage-people-on-probation-ui',
    version: '1.0.0',
    buildNumber: 'build-123',
    gitRef: 'git-ref-123',
    gitShortHash: 'git-ref',
    productId: 'manage-people-on-probation-ui',
    branchName: 'branch-name-123',
  }),
}))

jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('../config', () => ({
  __esModule: true,
  getConfig: jest.fn(),
}))

const mockedConfig = {
  dateFields: ['date'],
}

const mockedGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
mockedGetConfig.mockReturnValue(mockedConfig)

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
              start: '9:00am',
              end: '9:30am',
            },
          },
        },
        _minDate: '12/03/2025',
        _maxDate: '31/12/2199',
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
      url: `/case/${crn}/arrange-appointment/${id}/sentence`,
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
              eventId: '12 month Community order',
              licenceConditionId: 'Freedom of movement',
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

  describe('If sentence with licence condition', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id,
      },
      url: `/case/${crn}/arrange-appointment/${id}/sentence`,
      session: {
        data: {
          appointments: {
            [crn]: {
              [id]: {
                type: 'COAI',
                licenceConditionId: '',
                requirementId: '2500711169',
                nsiId: '2500711277',
                numberOfAppointments: '2',
                numberOfRepeatAppointments: '1',
                interval: '',
                repeatingDates: [],
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
              eventId: '2501192724',
              licenceConditionId: '2500686668',
            },
          },
        },
      },
    })
    beforeEach(() => {
      autoStoreSessionData(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should delete the requirement and nsi ids in the appointment session', () => {
      expect(req.session.data.appointments[crn][id].requirementId).toBeUndefined()
      expect(req.session.data.appointments[crn][id].nsiId).toBeUndefined()
    })
  })
  describe('If sentence with requirement', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id,
      },
      url: `/case/${crn}/arrange-appointment/${id}/sentence`,
      session: {
        data: {
          appointments: {
            [crn]: {
              [id]: {
                type: 'COAI',
                licenceConditionId: '2500711169',
                requirementId: '',
                nsiId: '2500711277',
                numberOfAppointments: '2',
                numberOfRepeatAppointments: '1',
                interval: '',
                repeatingDates: [],
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
              eventId: '2501192724',
              requirementId: '2500686668',
            },
          },
        },
      },
    })
    beforeEach(() => {
      autoStoreSessionData(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should delete the licence condition and nsi ids in the appointment session', () => {
      expect(req.session.data.appointments[crn][id].licenceConditionId).toBeUndefined()
      expect(req.session.data.appointments[crn][id].nsiId).toBeUndefined()
    })
  })
  describe('If sentence with nsi', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id,
      },
      url: `/case/${crn}/arrange-appointment/${id}/sentence`,
      session: {
        data: {
          appointments: {
            [crn]: {
              [id]: {
                type: 'COAI',
                licenceConditionId: '2500711169',
                requirementId: '2500711277',
                nsiId: '',
                numberOfAppointments: '2',
                numberOfRepeatAppointments: '1',
                interval: '',
                repeatingDates: [],
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
              eventId: '2501192724',
              nsiId: '2500686668',
            },
          },
        },
      },
    })
    beforeEach(() => {
      autoStoreSessionData(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should delete the licence condition and requirement ids in the appointment session', () => {
      expect(req.session.data.appointments[crn][id].licenceConditionId).toBeUndefined()
      expect(req.session.data.appointments[crn][id].requirementId).toBeUndefined()
    })
  })
  describe('If sentence with no licence condition, requirement or nsi', () => {
    const req = httpMocks.createRequest({
      params: {
        crn,
        id,
      },
      url: `/case/${crn}/arrange-appointment/${id}/sentence`,
      session: {
        data: {
          appointments: {
            [crn]: {
              [id]: {
                type: 'COAI',
                licenceConditionId: '2500711169',
                requirementId: '2500711277',
                nsiId: '250071127',
                numberOfAppointments: '2',
                numberOfRepeatAppointments: '1',
                interval: '',
                repeatingDates: [],
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
              eventId: '2501192724',
            },
          },
        },
      },
    })
    beforeEach(() => {
      autoStoreSessionData(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should delete the licence condition, requirement and nsi ids in the appointment session', () => {
      expect(req.session.data.appointments[crn][id].licenceConditionId).toBeUndefined()
      expect(req.session.data.appointments[crn][id].requirementId).toBeUndefined()
      expect(req.session.data.appointments[crn][id].nsiId).toBeUndefined()
    })
  })
  describe('If value is an object', () => {
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
                user: {
                  username: 'USER1',
                },
                type: 'COAI',
                licenceConditionId: '2500711169',
                requirementId: '2500711277',
                nsiId: '',
                numberOfAppointments: '2',
                numberOfRepeatAppointments: '1',
                interval: '',
                repeatingDates: [],
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
              user: { locationCode: '2500035096' },
            },
          },
        },
      },
    })
    beforeEach(() => {
      autoStoreSessionData(hmppsAuthClient)(req, res, nextSpy)
    })
    it('should reset the licence condition and nsi ids in the appointment session', () => {
      expect(req.session.data.appointments[crn][id].user).toStrictEqual({
        username: 'USER1',
        locationCode: '2500035096',
      })
    })
  })
})
