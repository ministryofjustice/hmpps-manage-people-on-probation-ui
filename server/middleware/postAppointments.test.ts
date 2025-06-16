import httpMocks from 'node-mocks-http'
import { postAppointments, dateTime } from './postAppointments'

import MasApiClient from '../data/masApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { Sentence } from '../data/model/sentenceDetails'
import { UserLocation } from '../data/model/caseload'
import { appointmentTypes } from '../properties'
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
    eventNumber: 12345,
    mainOffence: {
      code: '18502',
      description: '12 month community order',
    },
    order: {
      description: '12 month Community order',
      startDate: '2023-12-01',
      length: '2',
    },
    licenceConditions: [],
    requirements: [],
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
            type: 'Home visit',
            date: '2025-03-12',
            location: 'HMP Wakefield',
            'start-time': '9:00am',
            'end-time': '9:30am',
            'repeating-frequency': 'WEEK',
            'repeating-count': '2',
            sentence: '12 month Community order',
            'sentence-requirement': '',
            'sentence-licence-condition': 'Alcohol Monitoring (Electronic Monitoring)',
          },
        },
      },
    },
  },
})

const nextSpy = jest.fn()

describe('/middleware/postAppointments', () => {
  const {
    date,
    'start-time': startTime,
    'end-time': endTime,
    'repeating-frequency': interval,
    'repeating-count': repeatCount,
  } = req.session.data.appointments[crn][id]

  const expectedBody = {
    user: {
      username,
      locationId: mockUserLocations[0].id,
    },
    type: appointmentTypes[0].value,
    start: dateTime(date, startTime),
    end: dateTime(date, endTime),
    interval,
    numberOfAppointments: parseInt(repeatCount, 10),
    eventNumber: mockSentences[0].eventNumber,
    createOverlappingAppointment: true,
    requirementId: 0,
    licenceConditionId: 0,
    uuid: id,
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
