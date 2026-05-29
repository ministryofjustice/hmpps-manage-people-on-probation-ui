import httpMocks from 'node-mocks-http'
import { getComplianceData } from './getComplianceData'
import { mockAppResponse } from '../../controllers/mocks'
import MasApiClient from '../../data/masApiClient'
import { NonComplianceHistoryResponse } from '../../data/model/compliance'

jest.mock('../../data/masApiClient')

const nextSpy = jest.fn()

describe('/middleware/appointment-outcomes/getComplianceData', () => {
  let req: any
  let res: any
  let masClient: jest.Mocked<MasApiClient>

  beforeEach(() => {
    req = httpMocks.createRequest()
    req.session = {
      data: {
        appointments: {
          X000001: {
            '123': {
              eventId: '1',
            },
          },
        },
        sentences: {
          X000001: [{ id: '1', eventNumber: '1' }],
        },
      },
    }
    res = mockAppResponse({
      appointmentOutcome: {
        crn: 'X000001',
        id: '123',
      },
      user: { username: 'user1' },
    })
    masClient = new MasApiClient(null) as jest.Mocked<MasApiClient>
    ;(MasApiClient as jest.Mock as any).mockImplementation(() => masClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch and set compliance data', async () => {
    const complianceData = {
      currentSentences: [
        {
          eventNumber: '1',
          compliance: { failureToComplyCount: 1, breachesOnCurrentOrderCount: 0 },
        },
      ],
    }
    const nonComplianceData: NonComplianceHistoryResponse = {
      unacceptableAbsence: [],
      acceptableAbsence: [],
      attendedButDidNotComply: [],
    }

    masClient.getPersonCompliance.mockResolvedValue(complianceData as any)
    masClient.getPersonNonCompliance.mockResolvedValue(nonComplianceData as any)

    const hmppsAuthClient = {
      getSystemClientToken: jest.fn().mockResolvedValue('token'),
    }

    await getComplianceData(hmppsAuthClient as any)(req, res, nextSpy)

    expect(res.locals.appointmentOutcome.compliance).toEqual({
      failureToComplyInLast12MonthsCount: 1,
      priorBreachesOnCurrentOrderCount: 0,
      failureToComplyCount: 1,
      breachesOnCurrentOrderCount: 0,
      nonCompliance: nonComplianceData,
    })
    expect(nextSpy).toHaveBeenCalled()
  })
})
