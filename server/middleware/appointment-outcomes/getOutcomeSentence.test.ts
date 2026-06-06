import httpMocks from 'node-mocks-http'
import { getDataValue } from '../../utils'
import { HmppsAuthClient } from '../../data'
import MasApiClient from '../../data/masApiClient'
import { mockAppResponse } from '../../controllers/mocks'
import { getOutcomeSentence } from './getOutcomeSentence'
import { AppointmentOutcomeSentence } from '../../models/Locals'
import { Sentence, SentenceType } from '../../data/model/sentenceDetails'
import { BreachOrRecall, PersonCompliance, SentenceCompliance } from '../../data/model/compliance'
import { Compliance } from '../../data/model/overview'

const activeBreach: BreachOrRecall = { startDate: '2024-01-01', status: 'BREACH_INITIATED' }
const activeRecall: BreachOrRecall = { startDate: '2024-01-01', status: 'RECALL_INITIATED' }

jest.mock('../../utils', () => {
  const actualUtils = jest.requireActual('../../utils')
  return {
    ...actualUtils,
    getDataValue: jest.fn(),
  }
})

jest.mock('../../data/hmppsAuthClient')
jest.mock('../../data/masApiClient')

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const getDataValueSpy = getDataValue as jest.MockedFunction<typeof getDataValue>

const sentenceEventId: { [K in SentenceType]?: number } = {
  CUSTODY: 49,
  COMMUNITY: 48,
}

const sentenceEventNumber: { [K in SentenceType]?: string } = {
  CUSTODY: '123',
  COMMUNITY: '456',
}

const getPersonComplianceSpy = jest.spyOn(MasApiClient.prototype, 'getPersonCompliance')

const mockSentences = (endDate = '2026-05-31'): Sentence[] => [
  {
    id: sentenceEventId.CUSTODY,
    eventNumber: sentenceEventNumber.CUSTODY,
    sentenceType: 'CUSTODY',
    order: {
      description: 'Pre-Sentence',
      startDate: '2025-05-31',
      endDate,
    },
    nsis: [],
    licenceConditions: [],
    requirements: [],
  },
  {
    id: sentenceEventId.COMMUNITY,
    eventNumber: sentenceEventNumber.COMMUNITY,
    sentenceType: 'COMMUNITY',
    order: {
      description: 'Pre-Sentence',
      startDate: '2025-05-31',
      endDate,
    },
    nsis: [],
    licenceConditions: [],
    requirements: [],
  },
]

const mockComplianceCurrentSentence = ({
  sentenceType = 'COMMUNITY',
  activeBreachOrRecall = false,
}: { sentenceType?: SentenceType; activeBreachOrRecall?: boolean } = {}): Partial<SentenceCompliance> => {
  const currentSentence: Partial<SentenceCompliance> = {
    eventNumber: sentenceEventNumber[sentenceType],
    compliance: {
      priorBreachesOnCurrentOrderCount: 1,
      failureToComplyCount: 1,
    } as Compliance,
  }
  if (activeBreachOrRecall) {
    if (sentenceType === 'COMMUNITY') {
      currentSentence.activeBreach = activeBreach
    } else {
      currentSentence.activeRecall = activeRecall
    }
  }
  return currentSentence
}

const mockPersonComplianceResponse = ({
  sentenceType = 'COMMUNITY',
  activeBreachOrRecall = false,
}: { sentenceType?: SentenceType; activeBreachOrRecall?: boolean } = {}) =>
  ({
    currentSentences: [mockComplianceCurrentSentence({ sentenceType, activeBreachOrRecall }) as SentenceCompliance],
  }) as PersonCompliance

const buildResponse = ({
  sentenceType = 'COMMUNITY',
}: {
  sentenceType?: SentenceType
} = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      appointmentSession: {
        eventId: sentenceEventId[sentenceType].toString(),
      },
    },
  }
  return mockAppResponse(locals)
}

const nextSpy = jest.fn()

const req = httpMocks.createRequest({ session: {} })

describe('/middleware/appointment-outcomes/getOutcomeSentence', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should assign the correct sentence if sentence type = COMMUNITY and does not have an active breach', async () => {
    const response = mockPersonComplianceResponse()
    getPersonComplianceSpy.mockResolvedValueOnce(response)
    getDataValueSpy.mockReturnValueOnce(mockSentences())
    const res = buildResponse()
    await getOutcomeSentence(hmppsAuthClient)(req, res, nextSpy)
    const expectedSentence: AppointmentOutcomeSentence = {
      type: 'COMMUNITY',
      length: 12,
      eventId: sentenceEventId.COMMUNITY,
      eventNumber: sentenceEventNumber.COMMUNITY,
      order: 'Pre-Sentence',
      activeBreach: null,
      compliance: mockComplianceCurrentSentence().compliance,
    }
    expect(res.locals.appointmentOutcome.sentence).toStrictEqual(expectedSentence)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })

  it('should assign the correct sentence if sentence type = COMMUNITY and has an active breach', async () => {
    const response = mockPersonComplianceResponse({ activeBreachOrRecall: true })
    getPersonComplianceSpy.mockResolvedValueOnce(response)
    getDataValueSpy.mockReturnValueOnce(mockSentences())
    const res = buildResponse()
    await getOutcomeSentence(hmppsAuthClient)(req, res, nextSpy)
    const expectedSentence: AppointmentOutcomeSentence = {
      type: 'COMMUNITY',
      length: 12,
      eventId: sentenceEventId.COMMUNITY,
      eventNumber: sentenceEventNumber.COMMUNITY,
      order: 'Pre-Sentence',
      activeBreach,
      compliance: mockComplianceCurrentSentence().compliance,
    }
    expect(res.locals.appointmentOutcome.sentence).toStrictEqual(expectedSentence)
  })

  it('should assign the correct sentence if sentence type = CUSTODY and does not have an active recall', async () => {
    const sentenceType: SentenceType = 'CUSTODY'
    const response = mockPersonComplianceResponse({ sentenceType, activeBreachOrRecall: false })
    getPersonComplianceSpy.mockResolvedValueOnce(response)
    getDataValueSpy.mockReturnValueOnce(mockSentences())
    const res = buildResponse({ sentenceType })
    await getOutcomeSentence(hmppsAuthClient)(req, res, nextSpy)
    const expectedSentence: AppointmentOutcomeSentence = {
      type: sentenceType,
      length: 12,
      eventId: sentenceEventId[sentenceType],
      eventNumber: sentenceEventNumber[sentenceType],
      order: 'Pre-Sentence',
      activeRecall: null,
      compliance: mockComplianceCurrentSentence({ sentenceType }).compliance,
    }
    expect(res.locals.appointmentOutcome.sentence).toStrictEqual(expectedSentence)
  })

  it('should assign the correct sentence if sentence type = CUSTODY and has an active recall', async () => {
    const sentenceType: SentenceType = 'CUSTODY'
    const response = mockPersonComplianceResponse({ sentenceType, activeBreachOrRecall: true })
    getPersonComplianceSpy.mockResolvedValueOnce(response)
    getDataValueSpy.mockReturnValueOnce(mockSentences('2027-05-31'))
    const res = buildResponse({ sentenceType })
    await getOutcomeSentence(hmppsAuthClient)(req, res, nextSpy)
    const expectedSentence: AppointmentOutcomeSentence = {
      type: sentenceType,
      length: 24,
      eventId: sentenceEventId[sentenceType],
      eventNumber: sentenceEventNumber[sentenceType],
      order: 'Pre-Sentence',
      activeRecall,
      compliance: mockComplianceCurrentSentence({ sentenceType }).compliance,
    }
    expect(res.locals.appointmentOutcome.sentence).toStrictEqual(expectedSentence)
  })

  it('should assign the correct sentence details if no compliance', async () => {
    const response = { currentSentences: [] } as PersonCompliance
    getPersonComplianceSpy.mockResolvedValueOnce(response)
    getDataValueSpy.mockReturnValueOnce(mockSentences())
    const res = buildResponse()
    await getOutcomeSentence(hmppsAuthClient)(req, res, nextSpy)
    const expectedSentence: AppointmentOutcomeSentence = {
      type: 'COMMUNITY',
      length: 12,
      eventId: sentenceEventId.COMMUNITY,
      eventNumber: sentenceEventNumber.COMMUNITY,
      order: 'Pre-Sentence',
      activeBreach: null,
      compliance: null,
    }
    expect(res.locals.appointmentOutcome.sentence).toStrictEqual(expectedSentence)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
