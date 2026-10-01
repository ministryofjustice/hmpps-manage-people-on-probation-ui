import PrisonerSearchApiClient, { Prisoner } from '../data/prisonerSearchApiClient'
import logger from '../../logger'
import { getPersonStatusTag, getPrisonerDetails } from './personStatusTag'

jest.mock('../data/prisonerSearchApiClient')
jest.mock('../../logger')

const mockedPrisonerSearchApiClient = PrisonerSearchApiClient as jest.MockedClass<typeof PrisonerSearchApiClient>
const mockedLogger = logger as jest.Mocked<typeof logger>

describe('getPersonStatusTag', () => {
  it('returns "Deceased" when the legal status is DEAD', () => {
    const prisoner: Prisoner = {
      legalStatus: 'DEAD',
      status: 'ACTIVE IN',
      lastMovementReasonCode: 'UAL',
      recall: true,
    }

    expect(getPersonStatusTag(prisoner)).toBe('Deceased')
  })

  it('returns "Unlawfully at large" when the last movement reason is UAL', () => {
    const prisoner: Prisoner = {
      lastMovementReasonCode: 'UAL',
      recall: false,
    }

    expect(getPersonStatusTag(prisoner)).toBe('Unlawfully at large')
  })

  it('returns "Recalled - Unlawfully at large" when the last movement reason is UAL and prisoner is recalled', () => {
    const prisoner: Prisoner = {
      lastMovementReasonCode: 'UAL',
      recall: true,
    }

    expect(getPersonStatusTag(prisoner)).toBe('Recalled - Unlawfully at large')
  })

  it('returns "In custody" when the status is ACTIVE IN', () => {
    const prisoner: Prisoner = {
      status: 'ACTIVE IN',
      recall: false,
    }

    expect(getPersonStatusTag(prisoner)).toBe('In custody')
  })

  it('returns "Recalled - In custody" when the status is ACTIVE IN and prisoner is recalled', () => {
    const prisoner: Prisoner = {
      status: 'ACTIVE IN',
      recall: true,
    }

    expect(getPersonStatusTag(prisoner)).toBe('Recalled - In custody')
  })

  it('returns "In custody" when the status is ACTIVE OUT', () => {
    const prisoner: Prisoner = {
      status: 'ACTIVE OUT',
      recall: false,
    }

    expect(getPersonStatusTag(prisoner)).toBe('In custody')
  })

  it('returns "Recalled - In custody" when the status is ACTIVE OUT and prisoner is recalled', () => {
    const prisoner: Prisoner = {
      status: 'ACTIVE OUT',
      recall: true,
    }

    expect(getPersonStatusTag(prisoner)).toBe('Recalled - In custody')
  })

  it('returns undefined when there is no matching status', () => {
    const prisoner: Prisoner = {
      status: 'INACTIVE',
      legalStatus: 'SENTENCED',
      lastMovementReasonCode: 'ADM',
      recall: false,
    }

    expect(getPersonStatusTag(prisoner)).toBeUndefined()
  })
})

describe('getPrisonerDetails', () => {
  let prisonerSearchApiClient: jest.Mocked<PrisonerSearchApiClient>

  beforeEach(() => {
    jest.clearAllMocks()

    prisonerSearchApiClient = {
      getPrisonerDetails: jest.fn(),
    } as unknown as jest.Mocked<PrisonerSearchApiClient>

    mockedPrisonerSearchApiClient.mockImplementation(() => prisonerSearchApiClient)
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

    const result = await getPrisonerDetails('token', 'A1234BC')

    expect(result).toEqual(prisoner)
    expect(prisonerSearchApiClient.getPrisonerDetails).toHaveBeenCalledWith('A1234BC')
  })

  it('returns null and logs an error when the Prisoner Search API fails', async () => {
    const error = new Error('API failed')

    prisonerSearchApiClient.getPrisonerDetails.mockRejectedValue(error)

    const result = await getPrisonerDetails('token', 'A1234BC')

    expect(result).toEqual(undefined)
    expect(mockedLogger.error).toHaveBeenCalledWith('Failed to get prisoner details for NOMS number: A1234BC', error)
  })
})
