import httpMocks from 'node-mocks-http'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 as uuidv4 } from 'uuid'
import renders from '.'
import HmppsAuthClient from '../../data/hmppsAuthClient'
import MasApiClient from '../../data/masApiClient'
import TokenStore from '../../data/tokenStore/redisTokenStore'
import { AppResponse } from '../../@types'
import TierApiClient from '../../data/tierApiClient'
import ArnsApiClient from '../../data/arnsApiClient'
import { toRoshWidget, toPredictors } from '../../utils/utils'
import { PersonAppointment } from '../../data/model/schedule'
import { mockTierCalculation, mockRisks, mockPredictors } from './activityLog.test'

jest.mock('@ministryofjustice/hmpps-audit-client')

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const id = '1234'

const mockActivity = {
  personSummary: {
    name: {
      forename: 'Eula',
      surname: 'Schmeler',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  appointment: {
    id: 16,
    type: 'Office appointment',
    description: '',
    startDateTime: '2024-02-21T10:15:00.382936Z[Europe/London]',
    endDateTime: '2024-02-21T10:30:00.382936Z[Europe/London]',
    rarToolKit: 'Choices and Changes',
    isSensitive: false,
    hasOutcome: false,
    wasAbsent: true,
    nonComplianceReason: 'Was very argumentative and left the appointment',
    didTheyComply: false,
    isAppointment: true,
    isNationalStandard: true,
    notes: 'Some notes',
    lastUpdated: '2023-03-20',
    officerName: {
      forename: 'Terry',
      surname: 'Jones',
    },
    lastUpdatedBy: {
      forename: 'Paul',
      surname: 'Smith',
    },
  },
} as unknown as PersonAppointment

const req = httpMocks.createRequest({
  params: {
    crn,
    id,
  },
  query: { page: '', view: 'default', category: 'mock-category' },
})

const res = {
  locals: {
    user: {
      username: 'user-1',
    },
    filters: {
      dateFrom: '',
      dateTo: '',
      keywords: '',
    },
  },
  redirect: jest.fn().mockReturnThis(),
  render: jest.fn().mockReturnThis(),
} as unknown as AppResponse

jest.mock('../../data/masApiClient')
jest.mock('../../data/tokenStore/redisTokenStore')
jest.mock('../../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})
jest.mock('../../data/arnsApiClient')
jest.mock('../../utils/utils', () => ({
  toRoshWidget: jest.fn(),
  toPredictors: jest.fn(),
}))

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

const getPersonAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonAppointment')
  .mockImplementation(() => Promise.resolve(mockActivity))

const getCalculationDetailsSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))

const getRisksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))
const getPredictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))

const auditSpy = jest.spyOn(auditService, 'sendAuditMessage')
const renderSpy = jest.spyOn(res, 'render')

describe('controllers/activityDetails', () => {
  beforeEach(async () => {
    await renders.activityDetails(hmppsAuthClient)(req, res)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('should request the person appointment from the api', () => {
    expect(getPersonAppointmentSpy).toHaveBeenCalledWith(crn, id)
  })
  it('should request the tier calculation from the api', () => {
    expect(getCalculationDetailsSpy).toHaveBeenCalledWith(crn)
  })
  it('should request risks and predictors from the api', () => {
    expect(getRisksSpy).toHaveBeenCalledWith(crn)
    expect(getPredictorsSpy).toHaveBeenCalledWith(crn)
  })
  it('should send an audit message', () => {
    expect(auditSpy).toHaveBeenCalledWith({
      action: 'VIEW_MAS_ACTIVITY_LOG_DETAIL',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: uuidv4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })
  })
  it('should render the appointment page', () => {
    expect(renderSpy).toHaveBeenCalledWith('pages/appointments/appointment', {
      category: req.query.category,
      queryParams: ['view=default'],
      personAppointment: mockActivity,
      crn,
      isActivityLog: true,
      tierCalculation: mockTierCalculation,
      risksWidget: toRoshWidget(mockRisks),
      predictorScores: toPredictors(mockPredictors),
    })
  })
})
