import httpMocks from 'node-mocks-http'
import { getContactOutcomes } from './getContactOutcomes'
import { getDataValue, setDataValue } from '../../utils'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { ContactEnforcementAction, ContactOutcome, ContactOutcomesResponse } from '../../data/model/schedule'
import { mockAppResponse } from '../../controllers/mocks'

const crn = 'X000001'
const contactId = '12345'
const type = 'COAP'
const id = '03156640-7ae0-491e-a379-dd47a301369a'

jest.mock('../../data/hmppsAuthClient')
jest.mock('../../data/masApiClient')

jest.mock('../../utils', () => {
  return {
    setDataValue: jest.fn(),
    getDataValue: jest.fn(),
  }
})

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>

const setDataValueSpy = setDataValue as jest.MockedFn<typeof setDataValue>
const getDataValueSpy = getDataValue as jest.MockedFn<typeof getDataValue>

const outcome = { outcomeType: 'ATTENDED_COMPLIED' }
getDataValueSpy.mockImplementation(() => ({ outcome, type }))

const nextSpy = jest.fn()

const enforcementActions: ContactEnforcementAction[] = [
  { code: 'IBR', description: 'Breach / Recall Initiated', defaultResponsePeriodDays: 7 },
  { code: 'IBR', description: null, defaultResponsePeriodDays: 7 },
  { code: 'ROM', description: 'Refer to Offender Manager', defaultResponsePeriodDays: 7 },
]

const mockContactOutcomes: ContactOutcome[] = [
  {
    code: 'ATTC',
    description: 'Attended - Complied',
    enforcementActions,
  },
  {
    code: 'AFTC',
    description: 'Attended - Failed To Comply',
    enforcementActions: [],
  },
]

const mockOutcomes: ContactOutcomesResponse = {
  outcomes: mockContactOutcomes,
}

const getContactOutcomesSpy = jest
  .spyOn(MasApiClient.prototype, 'getContactOutcomes')
  .mockImplementation(() => Promise.resolve(mockOutcomes))

const buildRequest = ({
  _contactId = contactId,
  _id = null,
}: { _contactId?: string; _id?: string } = {}): httpMocks.MockRequest<any> => {
  const req = {
    params: {
      crn,
      contactId: _contactId,
      id: _id,
    },
    session: {
      data: {},
    },
    appointments: {
      [crn]: {
        [id]: {
          type,
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

const res = mockAppResponse()

describe('/middleware/appointment-outcomes/getContactOutcomes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should set the data if manage journey', async () => {
    const req = buildRequest()
    await getContactOutcomes(hmppsAuthClient)(req, res, nextSpy)
    expect(getContactOutcomesSpy).toHaveBeenCalledWith(type)
    expect(getDataValueSpy).toHaveBeenCalledWith(req.session.data, ['appointments', crn, contactId])
    expect(setDataValueSpy).toHaveBeenCalledWith(req.session.data, ['appointments', crn, contactId, 'outcome'], {
      ...outcome,
      contactOutcomes: mockContactOutcomes,
    })
  })
  it('should set the data if arrange journey', async () => {
    const req = buildRequest({ _contactId: null, _id: id })
    await getContactOutcomes(hmppsAuthClient)(req, res, nextSpy)
    expect(getDataValueSpy).toHaveBeenCalledWith(req.session.data, ['appointments', crn, id])
    expect(getContactOutcomesSpy).toHaveBeenCalledWith(type)
    expect(setDataValueSpy).toHaveBeenCalledWith(req.session.data, ['appointments', crn, id, 'outcome'], {
      ...outcome,
      contactOutcomes: mockContactOutcomes,
    })
  })
})
