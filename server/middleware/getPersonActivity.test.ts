import { Request } from 'express'
import { getPersonActivity } from './getPersonActivity'
import { AppResponse } from '../@types'
import HmppsAuthClient from '../data/hmppsAuthClient'

const crn = 'X756510'
const mockPersonActivityResponse = {
  size: 10,
  page: 1,
  totalResults: 20,
  totalPages: 2,
  personSummary: {
    crn,
    name: {
      forename: 'Eula',
      surname: 'Schmeler',
    },
    dateOfBirth: '',
  },
  activities: [
    {
      id: '11',
      type: 'Phone call',
      startDateTime: '2044-12-22T09:15:00.382936Z[Europe/London]',
      endDateTime: '2044-12-22T09:30:00.382936Z[Europe/London]',
      rarToolKit: 'Choices and Changes',
      rarCategory: 'Stepping Stones',
      isSensitive: false,
      hasOutcome: false,
      wasAbsent: true,
      notes: '',

      isCommunication: true,
      isPhoneCallFromPop: true,
      officerName: {
        forename: 'Terry',
        surname: 'Jones',
      },
      lastUpdated: '2023-03-20',
      lastUpdatedBy: {
        forename: 'Paul',
        surname: 'Smith',
      },
    },
  ],
}
const mockTierCalculationResponse = {
  tierScore: '1',
  calculationId: '1',
  calculationDate: '',
  data: {
    protect: {
      tier: '',
      points: 1,
      pointsBreakdown: {
        NEEDS: 1,
        NO_MANDATE_FOR_CHANGE: 1,
        NO_VALID_ASSESSMENT: 1,
        OGRS: 1,
        IOM: 1,
        RSR: 1,
        ROSH: 1,
        MAPPA: 1,
        COMPLEXITY: 1,
        ADDITIONAL_FACTORS_FOR_WOMEN: 1,
      },
    },
    change: {
      tier: '',
      points: 1,
      pointsBreakdown: {
        NEEDS: 1,
        NO_MANDATE_FOR_CHANGE: 1,
        NO_VALID_ASSESSMENT: 1,
        OGRS: 1,
        IOM: 1,
        RSR: 1,
        ROSH: 1,
        MAPPA: 1,
        COMPLEXITY: 1,
        ADDITIONAL_FACTORS_FOR_WOMEN: 1,
      },
    },
    calculationVersion: '',
  },
}

jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})
jest.mock('../data/masApiClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      postPersonActivityLog: jest.fn().mockImplementation(() => Promise.resolve(mockPersonActivityResponse)),
    }
  })
})

jest.mock('../data/tierApiClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getCalculationDetails: jest.fn().mockImplementation(() => Promise.resolve(mockTierCalculationResponse)),
    }
  })
})

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>

describe('/middleware/getPersonActivity', () => {
  const req = {
    body: {},
    params: {},
    query: {},
    session: {},
    method: 'GET',
  } as Request

  const res = {
    locals: {
      filters: {},
      user: {
        username: 'user-1',
      },
    },
    redirect: jest.fn().mockReturnThis(),
  } as unknown as AppResponse

  const filterVals = {
    keywords: 'Some keywords',
    dateFrom: '14/1/2025',
    dateTo: '21/1/2025',
    compliance: ['complied', 'not complied'],
  }

  it('should request the filtered results from the api', async () => {
    req.query = { page: '0' }
    res.locals.filters = {
      ...filterVals,
      complianceOptions: [],
      errors: null,
      selectedFilterItems: {},
      baseUrl: '',
      query: { ...filterVals },
      queryStr: '',
      queryStrPrefix: '',
      queryStrSuffix: '',
      maxDate: '21/1/2025',
    }

    const [_tierCalculation, personActivity] = await getPersonActivity(req, res, hmppsAuthClient)
    expect(personActivity).toEqual(mockPersonActivityResponse)
  })
})
