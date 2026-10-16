import PrisonerSearchApiClient, { Prisoner } from '../data/prisonerSearchApiClient'
import logger from '../../logger'
import { PersonalDetails } from '../data/model/personalDetails'
import { SupervisionPackage } from '../models/SupervisionPackage'
import {
  determinePersonStatusTag,
  getPrisonerDetails,
  getStatusTag,
  getStatusTagForPersonInCustody,
} from './personStatusTag'

jest.mock('../data/prisonerSearchApiClient')
jest.mock('../../logger')

const mockedPrisonerSearchApiClient = PrisonerSearchApiClient as jest.MockedClass<typeof PrisonerSearchApiClient>
const mockedLogger = logger as jest.Mocked<typeof logger>

const createPersonalDetails = (overrides: Partial<PersonalDetails> = {}): PersonalDetails =>
  ({
    noms: 'A1234BC',
    crn: 'X123456',
    ...overrides,
  }) as PersonalDetails

const createSentence = (overrides: Record<string, unknown> = {}) => ({
  eventNumber: '1',
  startDate: '2025-01-01',
  endDate: '2026-01-01',
  supervisionPackage: { code: 'LIC', description: 'Licence' },
  type: {
    code: 'NC',
    description: 'Non-custodial',
    isCustodial: false,
  },
  custody: {},
  inBreach: false,
  isPrimarySentence: true,
  ...overrides,
})

const createSupervisionPackage = (overrides: Record<string, unknown> = {}): SupervisionPackage =>
  ({
    outcome: 'success',
    context: {
      sentences: [createSentence()],
    },
    ...overrides,
  }) as SupervisionPackage

describe('getStatusTag', () => {
  const personalDetails = createPersonalDetails()

  it('returns the custody status when a primary custodial sentence exists', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            type: { isCustodial: true },
          }),
        ],
      },
    })

    const prisoner: Prisoner = {
      status: 'ACTIVE IN',
      recall: false,
    }

    const prisonerSearchApiClient = {
      getPrisonerDetails: jest.fn().mockResolvedValue(prisoner),
    }

    mockedPrisonerSearchApiClient.mockImplementation(
      () => prisonerSearchApiClient as unknown as PrisonerSearchApiClient,
    )

    await expect(getStatusTag('token', personalDetails, supervisionPackage)).resolves.toBe('In custody')

    expect(prisonerSearchApiClient.getPrisonerDetails).toHaveBeenCalledWith('A1234BC')
  })

  it('defaults to In custody when a primary custodial sentence exists but no prisoner status is available', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            type: { isCustodial: true },
          }),
        ],
      },
    })

    const prisonerSearchApiClient = {
      getPrisonerDetails: jest.fn().mockResolvedValue(null),
    }

    mockedPrisonerSearchApiClient.mockImplementation(
      () => prisonerSearchApiClient as unknown as PrisonerSearchApiClient,
    )

    await expect(getStatusTag('token', personalDetails, supervisionPackage)).resolves.toBe('In custody')
  })

  it('returns In breach when a primary community sentence is in breach', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            inBreach: true,
            type: { isCustodial: false },
          }),
        ],
      },
    })

    await expect(getStatusTag('token', personalDetails, supervisionPackage)).resolves.toBe('In breach')
  })

  it('does not return In breach when only a non-primary sentence is in breach', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            isPrimarySentence: false,
            inBreach: true,
          }),
        ],
      },
    })

    await expect(getStatusTag('token', personalDetails, supervisionPackage)).resolves.toBeUndefined()
  })

  it('returns undefined when there are no primary sentences', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            isPrimarySentence: false,
          }),
        ],
      },
    })

    await expect(getStatusTag('token', personalDetails, supervisionPackage)).resolves.toBeUndefined()
  })

  it('returns undefined when the supervision package outcome is not success', async () => {
    const supervisionPackage = createSupervisionPackage({
      outcome: 'failure',
    })

    await expect(getStatusTag('token', personalDetails, supervisionPackage)).resolves.toBeUndefined()
  })

  it('prioritises custodial status over community breach', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            inBreach: true,
            type: { isCustodial: true },
          }),
        ],
      },
    })

    const prisonerSearchApiClient = {
      getPrisonerDetails: jest.fn().mockResolvedValue({
        status: 'ACTIVE IN',
        recall: false,
      }),
    }

    mockedPrisonerSearchApiClient.mockImplementation(
      () => prisonerSearchApiClient as unknown as PrisonerSearchApiClient,
    )

    await expect(getStatusTag('token', personalDetails, supervisionPackage)).resolves.toBe('In custody')
  })
})

describe('getStatusTagForPersonInCustody', () => {
  let prisonerSearchApiClient: jest.Mocked<PrisonerSearchApiClient>

  beforeEach(() => {
    jest.clearAllMocks()

    prisonerSearchApiClient = {
      getPrisonerDetails: jest.fn(),
    } as unknown as jest.Mocked<PrisonerSearchApiClient>

    mockedPrisonerSearchApiClient.mockImplementation(() => prisonerSearchApiClient)
  })

  it('returns the determined status tag for a prisoner', async () => {
    prisonerSearchApiClient.getPrisonerDetails.mockResolvedValue({
      status: 'ACTIVE IN',
      recall: false,
    })

    await expect(getStatusTagForPersonInCustody('token', createPersonalDetails())).resolves.toBe('In custody')

    expect(prisonerSearchApiClient.getPrisonerDetails).toHaveBeenCalledWith('A1234BC')
  })

  it('returns undefined when prisoner details are unavailable', async () => {
    prisonerSearchApiClient.getPrisonerDetails.mockResolvedValue(null)

    await expect(getStatusTagForPersonInCustody('token', createPersonalDetails())).resolves.toBeUndefined()
  })
})

describe('determinePersonStatusTag', () => {
  const personalDetails = createPersonalDetails()

  it('returns Deceased when the legal status is DEAD', () => {
    const prisoner: Prisoner = {
      legalStatus: 'DEAD',
      status: 'ACTIVE IN',
      lastMovementReasonCode: 'UAL',
      recall: true,
    }

    expect(determinePersonStatusTag(prisoner, personalDetails)).toBe('Deceased')
  })

  it('returns Deceased when the personal details contain a date of death', () => {
    const prisoner: Prisoner = {
      status: 'ACTIVE IN',
    }

    expect(determinePersonStatusTag(prisoner, createPersonalDetails({ dateOfDeath: '2025-01-01' }))).toBe('Deceased')
  })

  it('returns Unlawfully at large when the last movement reason is UAL', () => {
    const prisoner: Prisoner = {
      lastMovementReasonCode: 'UAL',
      recall: false,
    }

    expect(determinePersonStatusTag(prisoner, personalDetails)).toBe('Unlawfully at large')
  })

  it('returns Recalled - Unlawfully at large when the prisoner is recalled', () => {
    const prisoner: Prisoner = {
      lastMovementReasonCode: 'UAL',
      recall: true,
    }

    expect(determinePersonStatusTag(prisoner, personalDetails)).toBe('Recalled - Unlawfully at large')
  })

  it.each(['ACTIVE IN', 'ACTIVE OUT'])(
    'returns In custody when the status is %s and the prisoner is not recalled',
    status => {
      const prisoner: Prisoner = {
        status,
        recall: false,
      }

      expect(determinePersonStatusTag(prisoner, personalDetails)).toBe('In custody')
    },
  )

  it.each(['ACTIVE IN', 'ACTIVE OUT'])(
    'returns Recalled - In custody when the status is %s and the prisoner is recalled',
    status => {
      const prisoner: Prisoner = {
        status,
        recall: true,
      }

      expect(determinePersonStatusTag(prisoner, personalDetails)).toBe('Recalled - In custody')
    },
  )

  it('returns undefined when there is no matching status', () => {
    const prisoner: Prisoner = {
      status: 'INACTIVE',
      legalStatus: 'SENTENCED',
      lastMovementReasonCode: 'ADM',
      recall: false,
    }

    expect(determinePersonStatusTag(prisoner, personalDetails)).toBeUndefined()
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

    await expect(getPrisonerDetails('token', 'A1234BC', 'X123456')).resolves.toEqual(prisoner)

    expect(prisonerSearchApiClient.getPrisonerDetails).toHaveBeenCalledWith('A1234BC')
  })

  it('returns undefined and logs an error when the API fails', async () => {
    const error = new Error('API failed')

    prisonerSearchApiClient.getPrisonerDetails.mockRejectedValue(error)

    await expect(getPrisonerDetails('token', 'A1234BC', 'X123456')).resolves.toBeUndefined()

    expect(mockedLogger.error).toHaveBeenCalledWith(
      'Failed to get prisoner details for NOMS number: A1234BC CRN: X123456',
      error,
    )
  })
})
