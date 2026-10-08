import { FliptEvaluationClient } from '@flipt-io/flipt-client'
import * as Sentry from '@sentry/node'
import FlagService from './flagService'

const email = 'test@example.com'
const username = 'user-1'

jest.mock('@sentry/node', () => ({
  getClient: jest.fn(() => ({})),
  captureException: jest.fn(),
}))

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
    enableDeliusClient: undefined,
    enableBreachOrRecallAndSendLetterAction: undefined,
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
            flagKey: 'enableBreachOrRecallAndSendLetterAction',
            enabled: true,
          },
        },
        {
          booleanEvaluationResponse: {
            flagKey: 'enableDeliusClient',
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
          flagKey: 'enableBreachOrRecallAndSendLetterAction',
          entityId: email,
          context: { email },
        }),
        expect.objectContaining({
          flagKey: 'enableDeliusClient',
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
    expect(
      requests.filter((r: { flagKey: string }) => r.flagKey === 'enableBreachOrRecallAndSendLetterAction'),
    ).toHaveLength(1)
    expect(requests.filter((r: { flagKey: string }) => r.flagKey === 'enableESupervisionCheckins')).toHaveLength(2)
  })
  it('adds a username request for username-gated flags', async () => {
    await service.getFlags({ email, username, pduCodes: ['PDU001', 'PDU002'] })
    const requests = mockEvaluateBatch.mock.calls[0][0]

    expect(requests).toEqual(
      expect.arrayContaining([
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
        expect.objectContaining({
          flagKey: 'enableESupervisionCheckins',
          entityId: email,
          context: { email, username },
        }),
      ]),
    )
    expect(requests.filter((r: { flagKey: string }) => r.flagKey === 'enableESupervisionCheckins')).toHaveLength(3)
  })
  it('resolves a PDU-gated flag to true if any pduCode evaluation is enabled', async () => {
    mockEvaluateBatch.mockReturnValue({
      responses: [
        { booleanEvaluationResponse: { flagKey: 'enableDeliusClient', enabled: false } },
        { booleanEvaluationResponse: { flagKey: 'enableBreachOrRecallAndSendLetterAction', enabled: false } },
        { booleanEvaluationResponse: { flagKey: 'enableESupervisionCheckins', enabled: false } },
        { booleanEvaluationResponse: { flagKey: 'enableESupervisionCheckins', enabled: true } },
      ],
    })
    expect(await service.getFlags({ email, pduCodes: ['PDU001', 'PDU002'] })).toStrictEqual({
      enableDeliusClient: false,
      enableBreachOrRecallAndSendLetterAction: false,
      enableESupervisionCheckins: true,
    })
  })
  it('resolves the check-ins flag to true if the username evaluation is enabled', async () => {
    mockEvaluateBatch.mockReturnValue({
      responses: [
        { booleanEvaluationResponse: { flagKey: 'enableDeliusClient', enabled: false } },
        { booleanEvaluationResponse: { flagKey: 'enableBreachOrRecallAndSendLetterAction', enabled: false } },
        { booleanEvaluationResponse: { flagKey: 'enableESupervisionCheckins', enabled: true } },
      ],
    })

    expect(await service.getFlags({ email, username, pduCodes: [] })).toStrictEqual({
      enableDeliusClient: false,
      enableBreachOrRecallAndSendLetterAction: false,
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
  it('fails closed for non-PDU-gated flags with unexpected response count', async () => {
    mockEvaluateBatch.mockReturnValue({
      responses: [
        { booleanEvaluationResponse: { flagKey: 'enableDeliusClient', enabled: true } },
        { booleanEvaluationResponse: { flagKey: 'enableBreachOrRecallAndSendLetterAction', enabled: true } },
        { booleanEvaluationResponse: { flagKey: 'enableBreachOrRecallAndSendLetterAction', enabled: true } },
      ],
    })

    const result = await service.getFlags({ email })

    expect(result.enableDeliusClient).toBe(true)
    expect(result.enableBreachOrRecallAndSendLetterAction).toBe(false)
  })
  it('fails closed for check-ins flag when pduCodes is empty and username is not available', async () => {
    mockEvaluateBatch.mockReturnValue({
      responses: [
        { booleanEvaluationResponse: { flagKey: 'enableDeliusClient', enabled: false } },
        { booleanEvaluationResponse: { flagKey: 'enableBreachOrRecallAndSendLetterAction', enabled: true } },
      ],
    })

    const result = await service.getFlags({ email, pduCodes: [] })

    const requests = mockEvaluateBatch.mock.calls[0][0]
    expect(requests.filter((r: { flagKey: string }) => r.flagKey === 'enableESupervisionCheckins')).toHaveLength(0)
    expect(result.enableESupervisionCheckins).toBe(false)
  })
  it('fails closed for check-ins flag when all access route evaluations are disabled', async () => {
    mockEvaluateBatch.mockReturnValue({
      responses: [
        { booleanEvaluationResponse: { flagKey: 'enableDeliusClient', enabled: false } },
        { booleanEvaluationResponse: { flagKey: 'enableBreachOrRecallAndSendLetterAction', enabled: true } },
        { booleanEvaluationResponse: { flagKey: 'enableESupervisionCheckins', enabled: false } },
        { booleanEvaluationResponse: { flagKey: 'enableESupervisionCheckins', enabled: false } },
      ],
    })

    const result = await service.getFlags({ email, username, pduCodes: ['PDU001'] })

    expect(result.enableESupervisionCheckins).toBe(false)
  })
  it('calls evaluateBatch with correct requests if context.email does not exist', async () => {
    mockEvaluateBatch.mockReturnValue({
      responses: [],
    })
    await service.getFlags({ email: undefined })
    expect(mockEvaluateBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          entityId: 'enableBreachOrRecallAndSendLetterAction',
          context: {},
        }),
      ]),
    )
  })
  it('returns feature flags based on evaluation results', async () => {
    expect(await service.getFlags({ email: undefined })).toStrictEqual({
      enableDeliusClient: false,
      enableBreachOrRecallAndSendLetterAction: true,
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

  it('normalises username to lowercase before sending to Flipt', async () => {
    const mixedCaseUsername = 'User-ONE'

    await service.getFlags({ username: mixedCaseUsername })

    expect(mockEvaluateBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          flagKey: 'enableESupervisionCheckins',
          entityId: mixedCaseUsername.toLowerCase(),
          context: { username: mixedCaseUsername.toLowerCase() },
        }),
      ]),
    )
  })

  it('captures message in Sentry when enableBreachOrRecallAndSendLetterAction flag has unexpected response count', async () => {
    mockEvaluateBatch.mockReturnValue({
      responses: [
        { booleanEvaluationResponse: { flagKey: 'enableDeliusClient', enabled: true } },
        { booleanEvaluationResponse: { flagKey: 'enableBreachOrRecallAndSendLetterAction', enabled: true } },
        { booleanEvaluationResponse: { flagKey: 'enableBreachOrRecallAndSendLetterAction', enabled: false } },
        { booleanEvaluationResponse: { flagKey: 'enableESupervisionCheckins', enabled: true } },
      ],
    })

    const result = await service.getFlags({ email })

    expect(result.enableDeliusClient).toBe(true)
    expect(result.enableBreachOrRecallAndSendLetterAction).toBe(false)
    expect(result.enableESupervisionCheckins).toBe(true)

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          'Expected exactly 1 response for flag enableBreachOrRecallAndSendLetterAction, got 2',
        ),
      }),
      expect.objectContaining({
        tags: {
          flag: 'enableBreachOrRecallAndSendLetterAction',
          service: 'FlagService',
        },
        extra: {
          matchingLength: 2,
        },
      }),
    )
  })

  it('does not capture Sentry exception when no Sentry client exists', async () => {
    ;(Sentry.getClient as jest.Mock).mockReturnValue(undefined)

    mockEvaluateBatch.mockReturnValue({
      responses: [
        { booleanEvaluationResponse: { flagKey: 'enableDeliusClient', enabled: true } },
        { booleanEvaluationResponse: { flagKey: 'enableBreachOrRecallAndSendLetterAction', enabled: true } },
        { booleanEvaluationResponse: { flagKey: 'enableBreachOrRecallAndSendLetterAction', enabled: false } },
      ],
    })

    const result = await service.getFlags({ email })

    expect(result.enableBreachOrRecallAndSendLetterAction).toBe(false)

    expect(Sentry.getClient).toHaveBeenCalled()

    expect(Sentry.captureException).not.toHaveBeenCalled()
  })
})
