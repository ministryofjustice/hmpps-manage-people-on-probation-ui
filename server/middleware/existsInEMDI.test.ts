import EMDIClient from '../data/emdiClient'
import { existsInEMDI } from './existsInEMDI'

jest.mock('../data/emdiClient')

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
    expect(result).toBe(undefined)
  })

  it('should return the uri when the person exists in EMDI', async () => {
    const mockResponse = { uri: 'https://emdi/people/X123456' }
    mockEMDIClient.prototype.existsInEMDI.mockResolvedValue(mockResponse)

    const result = await existsInEMDI(crn, token)

    expect(EMDIClient).toHaveBeenCalledWith(token)
    expect(mockEMDIClient.prototype.existsInEMDI).toHaveBeenCalledWith(crn)
    expect(result).toBe('https://emdi/people/X123456')
  })

  it('should return undefined when the person does not exist in EMDI', async () => {
    mockEMDIClient.prototype.existsInEMDI.mockResolvedValue(null)

    const result = await existsInEMDI(crn, token)

    expect(result).toBeUndefined()
  })

  it('should return undefined when the response from EMDI is empty', async () => {
    mockEMDIClient.prototype.existsInEMDI.mockResolvedValue({} as any)

    const result = await existsInEMDI(crn, token)

    expect(result).toBeUndefined()
  })
})
