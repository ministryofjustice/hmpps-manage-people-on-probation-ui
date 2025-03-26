import { Request } from 'express'
import { getPersonActivity } from './getPersonActivity'
import { ActivityLogRequestBody, AppResponse } from '../@types'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import { toIsoDate } from '../utils/utils'

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

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
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/masApiClient')
jest.mock('../data/tierApiClient')

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
  let masSpy: jest.SpyInstance
  let tierSpy: jest.SpyInstance
  beforeEach(async () => {
    masSpy = jest
      .spyOn(MasApiClient.prototype, 'postPersonActivityLog')
      .mockImplementation(() => Promise.resolve(mockPersonActivityResponse))
    tierSpy = jest
      .spyOn(TierApiClient.prototype, 'getCalculationDetails')
      .mockImplementation(() => Promise.resolve(mockTierCalculationResponse))
  })

  it('should request the filtered results from the api', async () => {
    req.params = { crn }
    req.query = { page: '0' }
    res.locals.filters = {
      ...filterVals,
      complianceOptions: [],
      errors: null,
      selectedFilterItems: {},
      baseUrl: '',
      query: { ...filterVals },
      maxDate: '21/1/2025',
    }

    req.session.activityLogFilters = {
      keywords: filterVals.keywords,
      dateFrom: filterVals.dateFrom,
      dateTo: filterVals.dateTo,
      compliance: ['complied', 'not complied'],
    }

    const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>

    const expectedBody: ActivityLogRequestBody = {
      keywords: filterVals.keywords,
      dateFrom: toIsoDate(filterVals.dateFrom),
      dateTo: toIsoDate(filterVals.dateTo),
      filters: ['complied', 'notComplied'],
    }

    const [tierCalculation, personActivity] = await getPersonActivity(req, res, hmppsAuthClient)
    expect(masSpy).toHaveBeenCalledWith(crn, expectedBody, '0')
    expect(tierSpy).toHaveBeenCalledWith(crn)
    expect(personActivity).toEqual(mockPersonActivityResponse)
    expect(tierCalculation).toEqual(mockTierCalculationResponse)
  })
})
