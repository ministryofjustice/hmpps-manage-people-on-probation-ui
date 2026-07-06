import * as Sentry from '@sentry/node'
import EMDIClient from '../data/emdiClient'
import { existsInEMDI } from './existsInEMDI'
import logger from '../../logger'

jest.mock('@sentry/node')
jest.mock('../data/emdiClient')
jest.mock('../../logger')

describe('existsInEMDI', () => {
  const crn = 'X123456'
  const token = 'user-token'
  const mockEMDIClient = EMDIClient as jest.MockedClass<typeof EMDIClient>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return undefined', async () => {
    const mockResponse = { uri: '/people/X123456' }
    mockEMDIClient.prototype.existsInEMDI.mockResolvedValue(mockResponse)

    const result = await existsInEMDI(crn, token)

    expect(EMDIClient).toHaveBeenCalledWith(token)
    expect(mockEMDIClient.prototype.existsInEMDI).toHaveBeenCalledWith(crn)
    expect(result).toEqual({ uri: undefined })
  })

  it('should return the uri when the person exists in EMDI', async () => {
    const mockResponse = { uri: 'https://emdi/people/X123456' }
    mockEMDIClient.prototype.existsInEMDI.mockResolvedValue(mockResponse)

    const result = await existsInEMDI(crn, token)

    expect(EMDIClient).toHaveBeenCalledWith(token)
    expect(mockEMDIClient.prototype.existsInEMDI).toHaveBeenCalledWith(crn)
    expect(result).toEqual({ uri: 'https://emdi/people/X123456' })
  })

  it('should return undefined when the person does not exist in EMDI', async () => {
    mockEMDIClient.prototype.existsInEMDI.mockResolvedValue(null)

    const result = await existsInEMDI(crn, token)

    expect(result).toEqual({ uri: undefined })
  })

  it('should return undefined when the response from EMDI is empty', async () => {
    mockEMDIClient.prototype.existsInEMDI.mockResolvedValue({} as any)

    const result = await existsInEMDI(crn, token)

    expect(result).toEqual({ uri: undefined })
  })

  it('should capture exception in Sentry and log it when EMDI returns 500', async () => {
    const mockError = new Error('EMDI error')
    const mockResponse = { status: 500, error: mockError, uri: 'https://emdi/people/X123456' }
    mockEMDIClient.prototype.existsInEMDI.mockResolvedValue(mockResponse)
    ;(Sentry.captureException as jest.Mock).mockReturnValue('sentry-event-id')

    const result = await existsInEMDI(crn, token)

    expect(Sentry.captureException).toHaveBeenCalledWith(mockError, {
      tags: {
        'http.status': '500',
        'error.type': 'internal_server_error',
        service: 'Electronic monitoring data',
        operation: 'existsInEMDI',
      },
    })
    expect(logger.info).toHaveBeenCalledWith('Sentry eventId: sentry-event-id')
    expect(result).toEqual({ status: 500, error: mockError, uri: 'https://emdi/people/X123456' })
  })

  it('should use fallback error message when result.error is not available and status is 500', async () => {
    const mockResponse = {
      status: 500,
      errors: [{ text: 'Custom EMDI error message' }],
      uri: 'https://emdi/people/X123456',
    }
    mockEMDIClient.prototype.existsInEMDI.mockResolvedValue(mockResponse)
    ;(Sentry.captureException as jest.Mock).mockReturnValue('sentry-event-id')

    await existsInEMDI(crn, token)

    expect(Sentry.captureException).toHaveBeenCalledWith(new Error('Custom EMDI error message'), {
      tags: {
        'http.status': '500',
        'error.type': 'internal_server_error',
        service: 'Electronic monitoring data',
        operation: 'existsInEMDI',
      },
    })
  })

  it('should use default error message when result.error and result.errors are not available and status is 500', async () => {
    const mockResponse = {
      status: 500,
      uri: 'https://emdi/people/X123456',
    }
    mockEMDIClient.prototype.existsInEMDI.mockResolvedValue(mockResponse)
    ;(Sentry.captureException as jest.Mock).mockReturnValue('sentry-event-id')

    await existsInEMDI(crn, token)

    expect(Sentry.captureException).toHaveBeenCalledWith(
      new Error('Electronic monitoring data is currently unavailable.'),
      {
        tags: {
          'http.status': '500',
          'error.type': 'internal_server_error',
          service: 'Electronic monitoring data',
          operation: 'existsInEMDI',
        },
      },
    )
  })
})
