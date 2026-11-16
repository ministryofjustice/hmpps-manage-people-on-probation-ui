import PrisonerSearchApiClient, { Prisoner } from '../data/prisonerSearchApiClient'
import { getPrisonerDetails } from './personStatusTag'

jest.mock('../data/prisonerSearchApiClient')
jest.mock('../../logger')

const mockedPrisonerSearchApiClient = PrisonerSearchApiClient as jest.MockedClass<typeof PrisonerSearchApiClient>

describe('getPrisonerDetails', () => {
  let prisonerSearchApiClient: jest.Mocked<PrisonerSearchApiClient>

  beforeEach(() => {
    jest.clearAllMocks()

    prisonerSearchApiClient = {
      getPrisonerDetails: jest.fn(),
    } as unknown as jest.Mocked<PrisonerSearchApiClient>

    mockedPrisonerSearchApiClient.mockImplementation(() => prisonerSearchApiClient)
  })

  it('should log an error and return undefined when getting prisoner details fails', async () => {
    const error = new Error('API request failed')
    const nomisNumber = 'A1234BC'
    const crn = 'X123456'

    prisonerSearchApiClient.getPrisonerDetails.mockRejectedValue(error)

    const result = await getPrisonerDetails('token', nomisNumber, crn)

    expect(result).toBeUndefined()
  })
  it('returns prisoner details from the Prisoner Search API', async () => {
    const prisoner: Prisoner = {
      prisonerNumber: 'A1234BC',
      firstName: 'Andrew',
      lastName: 'Langley',
      status: 'ACTIVE IN',
      legalStatus: 'SENTENCED',
      recall: false,
    }

    prisonerSearchApiClient.getPrisonerDetails.mockResolvedValue(prisoner)

    await expect(getPrisonerDetails('token', 'A1234BC', 'X123456')).resolves.toEqual(prisoner)

    expect(prisonerSearchApiClient.getPrisonerDetails).toHaveBeenCalledWith('A1234BC')
  })

  it('returns null when the Prisoner Search API returns null', async () => {
    prisonerSearchApiClient.getPrisonerDetails.mockResolvedValue(null)

    await expect(getPrisonerDetails('token', 'A1234BC', 'X123456')).resolves.toBeNull()
  })
})
