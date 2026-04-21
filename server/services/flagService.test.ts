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
