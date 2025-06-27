import httpMocks from 'node-mocks-http'
import { postAppointments } from './postAppointments'
import { dateTime } from '../utils'
import MasApiClient from '../data/masApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { Sentence } from '../data/model/sentenceDetails'
import { UserLocation } from '../data/model/caseload'
import { AppResponse } from '../models/Locals'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const crn = 'X000001'
const id = '4715aa09-0f9d-4c18-948b-a42c45bc0974'
const username = 'user-1'
const res = {
  locals: {
    user: {
      username,
    },
  },
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const hmppsAuthClient = new HmppsAuthClient(tokenStore)

const mockUserLocations = [
  {
    id: 1234,
    description: 'HMP Wakefield',
    address: {
      buildingNumber: '5',
      streetName: 'Love Lane',
      town: 'Wakefield',
      county: 'West Yorkshire',
      postcode: 'WF2 9AG',
    },
  },
] as UserLocation[]

const mockSentences = [
  {
    id: 12345,
    eventNumber: '16',
    mainOffence: {
      code: '18502',
      description: '12 month community order',
    },
    order: {
      description: '12 month Community order',
      startDate: '2023-12-01',
      length: '2',
    },
    licenceConditions: [{ id: 12345, mainDescription: '12 month Community order' }],
    requirements: [{ id: 12345, description: '12 month Community order' }],
    nsis: [],
    offenceDetails: {
      eventNumber: '1234',
      offence: null,
      dateOfOffence: '2024-12-01',
      notes: '',
      additionalOffences: [],
    },
    conviction: {
      sentencingCourt: '',
      responsibleCourt: '',
      convictionDate: '',
      additionalSentences: '',
    },
    courtDocuments: [],
    unpaidWorkProgress: '',
  },
] as Sentence[]

const req = httpMocks.createRequest({
  params: {
    crn,
    id,
  },
  session: {
    data: {
      locations: {
        [username]: mockUserLocations,
      },
      sentences: {
        [crn]: mockSentences,
      },
      appointments: {
        [crn]: {
          [id]: {
            user: {
              locationCode: 'HMP',
              teamCode: 'TEA',
              username,
            },
            team: 'TEA',
            type: 'C084',
            date: '2025-03-12',
            start: '9:00am',
            end: '9:30pm',
            interval: 'WEEK',
            numberOfAppointments: '2',
            eventId: 2501138253,
            requirementId: 1,
            licenceConditionId: 2500686668,
            notes: 'Some notes',
            sensitivity: false,
          },
        },
      },
    },
  },
})

const nextSpy = jest.fn()

describe('/middleware/postAppointments', () => {
  const {
    user: { locationCode, teamCode },
    date,
    start: startTime,
    end: endTime,
    type,
    interval,
    eventId,
    numberOfAppointments: repeatCount,
    licenceConditionId,
  } = req.session.data.appointments[crn][id]

  const expectedBody = {
    user: {
      username,
      locationCode,
      teamCode,
    },
    type,
    start: dateTime(date, startTime),
    end: dateTime(date, endTime),
    interval,
    numberOfAppointments: parseInt(repeatCount, 10),
    createOverlappingAppointment: true,
    requirementId: 1,
    licenceConditionId,
    eventId,
    uuid: id,
    until: dateTime(date, endTime),
    notes: 'Some notes',
    sensitive: false,
    visorReport: false,
  }
  let spy: jest.SpyInstance
  beforeEach(async () => {
    spy = jest.spyOn(MasApiClient.prototype, 'postAppointments').mockImplementation(() => Promise.resolve(''))
    await postAppointments(hmppsAuthClient)(req, res, nextSpy)
  })
  it('should post the correct request body', () => {
    expect(spy).toHaveBeenCalledWith(crn, expectedBody)
  })
  it('should call next()', () => {
    expect(nextSpy).toHaveBeenCalled()
  })
})

describe('/middleware/postAppointments', () => {
  const {
    user: { locationCode, teamCode },
    date,
    start: startTime,
    end: endTime,
    type,
    interval,
    eventId,
    numberOfAppointments: repeatCount,
    licenceConditionId,
  } = req.session.data.appointments[crn][id]

  const expectedBody = {
    user: {
      username,
      locationCode,
      teamCode,
    },
    type,
    start: dateTime(date, startTime),
    end: dateTime(date, endTime),
    interval,
    numberOfAppointments: parseInt(repeatCount, 10),
    createOverlappingAppointment: true,
    requirementId: 1,
    licenceConditionId,
    eventId,
    uuid: id,
    until: dateTime(date, endTime),
    notes: 'Some notes',
    sensitive: false,
    visorReport: false,
  }
  let spy: jest.SpyInstance
  beforeEach(async () => {
    spy = jest.spyOn(MasApiClient.prototype, 'postAppointments').mockImplementation(() => Promise.resolve(''))
    await postAppointments(hmppsAuthClient)(req, res, nextSpy)
  })
  it('should post the correct request body', () => {
    expect(spy).toHaveBeenCalledWith(crn, expectedBody)
  })
  it('should call next()', () => {
    expect(nextSpy).toHaveBeenCalled()
  })
})
