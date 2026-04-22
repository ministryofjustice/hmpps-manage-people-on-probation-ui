import { FliptEvaluationClient } from '@flipt-io/flipt-client'
import { FlagService } from '.'

const email = 'test@example.com'

jest.mock('@flipt-io/flipt-client', () => ({
  FliptEvaluationClient: {
    init: jest.fn(),
  },
}))

jest.mock('../config', () => {
  const actual = jest.requireActual('../config')
  return {
    __esModule: true,
    default: {
      ...actual.default,
      flipt: {
        url: 'mock-url',
        token: 'mock-token',
      },
    },
  }
})

jest.mock('../data/model/featureFlags', () => ({
  FeatureFlags: jest.fn().mockImplementation(() => ({
    enableSentencePlan: undefined,
    enableSanIndicator: undefined,
    enableESupervisionCheckins: undefined,
  })),
}))

describe('FlagService', () => {
  const mockEvaluateBatch = jest.fn()
  const service = new FlagService()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(FliptEvaluationClient.init as jest.Mock).mockResolvedValue({
      evaluateBatch: mockEvaluateBatch,
    })

    mockEvaluateBatch.mockReturnValue({
      responses: [
        {
          booleanEvaluationResponse: {
            flagKey: 'enableSentencePlan',
            enabled: true,
          },
        },
        {
          booleanEvaluationResponse: {
            flagKey: 'enableSanIndicator',
            enabled: false,
          },
        },
        {
          booleanEvaluationResponse: {
            flagKey: 'enableESupervisionCheckins',
            enabled: false,
          },
        },
      ],
    })
  })

  it('calls FliptEvaluationClient.init with correct args', async () => {
    await service.getFlags({ email })
    expect(FliptEvaluationClient.init).toHaveBeenCalledWith('manage-people-on-probation-ui', {
      url: 'mock-url',
      authentication: {
        clientToken: 'mock-token',
      },
    })
  })
  it('calls evaluateBatch with correct requests if context.email exists', async () => {
    await service.getFlags({ email })
    expect(mockEvaluateBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          entityId: email,
          context: { email },
        }),
      ]),
    )
  })
  it('fans out pduCode requests only for PDU-gated flags', async () => {
    await service.getFlags({ email, pduCodes: ['PDU001', 'PDU002'] })
    const requests = mockEvaluateBatch.mock.calls[0][0]
    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          flagKey: 'enableSentencePlan',
          entityId: email,
          context: { email },
        }),
        expect.objectContaining({
          flagKey: 'enableSanIndicator',
          entityId: email,
          context: { email },
        }),
        expect.objectContaining({
          flagKey: 'enableESupervisionCheckins',
          entityId: email,
          context: { email, pduCode: 'PDU001' },
        }),
        expect.objectContaining({
          flagKey: 'enableESupervisionCheckins',
          entityId: email,
          context: { email, pduCode: 'PDU002' },
        }),
      ]),
    )
    expect(requests).toHaveLength(4)
    expect(requests.filter((r: { flagKey: string }) => r.flagKey === 'enableSentencePlan')).toHaveLength(1)
    expect(requests.filter((r: { flagKey: string }) => r.flagKey === 'enableESupervisionCheckins')).toHaveLength(2)
  })
  it('resolves a PDU-gated flag to true if any pduCode evaluation is enabled', async () => {
    mockEvaluateBatch.mockReturnValue({
      responses: [
        { booleanEvaluationResponse: { flagKey: 'enableSentencePlan', enabled: false } },
        { booleanEvaluationResponse: { flagKey: 'enableSanIndicator', enabled: false } },
        { booleanEvaluationResponse: { flagKey: 'enableESupervisionCheckins', enabled: false } },
        { booleanEvaluationResponse: { flagKey: 'enableESupervisionCheckins', enabled: true } },
      ],
    })
    expect(await service.getFlags({ email, pduCodes: ['PDU001', 'PDU002'] })).toStrictEqual({
      enableSentencePlan: false,
      enableSanIndicator: false,
      enableESupervisionCheckins: true,
    })
  })
  it('does not include pduCodes in context when empty array', async () => {
    await service.getFlags({ email, pduCodes: [] })
    expect(mockEvaluateBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          entityId: email,
          context: { email },
        }),
      ]),
    )
  })
  it('calls evaluateBatch with correct requests if context.email does not exist', async () => {
    mockEvaluateBatch.mockReturnValue({
      responses: [],
    })
    await service.getFlags({ email: undefined })
    expect(mockEvaluateBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          entityId: 'enableSentencePlan',
          context: {},
        }),
      ]),
    )
  })
  it('returns feature flags based on evaluation results', async () => {
    expect(await service.getFlags({ email: undefined })).toStrictEqual({
      enableSentencePlan: true,
      enableSanIndicator: false,
      enableESupervisionCheckins: false,
    })
  })

  it('normalises email to lowercase before sending to Flipt', async () => {
    const mixedCaseEmail = 'Test.User@Example.COM'

    await service.getFlags({ email: mixedCaseEmail })

    expect(mockEvaluateBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          entityId: mixedCaseEmail.toLowerCase(),
          context: { email: mixedCaseEmail.toLowerCase() },
        }),
      ]),
    )
  })
})
