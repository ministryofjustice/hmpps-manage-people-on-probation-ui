import PrisonerSearchApiClient, { Prisoner } from '../data/prisonerSearchApiClient'
import { PersonalDetails } from '../data/model/personalDetails'
import { SupervisionPackage } from '../models/SupervisionPackage'
import { getPrisonerDetails, getStatusTag, getStatusTagForPersonInCustody } from './personStatusTag'

jest.mock('../data/prisonerSearchApiClient')
jest.mock('../../logger')

const mockedPrisonerSearchApiClient = PrisonerSearchApiClient as jest.MockedClass<typeof PrisonerSearchApiClient>

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

  it('returns Deceased when the person has a date of death', async () => {
    const details = createPersonalDetails({
      dateOfDeath: '2025-01-01',
    })

    await expect(getStatusTag(details, createSupervisionPackage())).resolves.toBe('Deceased')
  })

  it('returns the custody status for a primary custodial sentence', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            type: {
              code: 'SC',
              description: 'Custodial',
              isCustodial: true,
            },
          }),
        ],
      },
    })

    const prisoner: Prisoner = {
      status: 'ACTIVE IN',
      recall: false,
    }

    await expect(getStatusTag(personalDetails, supervisionPackage, prisoner)).resolves.toBe('In custody')
  })

  it('returns Deceased when the prisoner legal status is DEAD', async () => {
    const prisoner: Prisoner = {
      legalStatus: 'DEAD',
      status: 'ACTIVE IN',
      recall: false,
    }

    await expect(getStatusTag(personalDetails, createSupervisionPackage(), prisoner)).resolves.toBe('Deceased')
  })

  it('returns Recalled - In custody when the prisoner is recalled', async () => {
    const prisoner: Prisoner = {
      status: 'ACTIVE IN',
      recall: true,
    }

    await expect(getStatusTag(personalDetails, createSupervisionPackage(), prisoner)).resolves.toBe(
      'Recalled - In custody',
    )
  })

  it('returns Unlawfully at large when the last movement reason is UAL', async () => {
    const prisoner: Prisoner = {
      lastMovementReasonCode: 'UAL',
      recall: false,
    }

    await expect(getStatusTag(personalDetails, createSupervisionPackage(), prisoner)).resolves.toBe(
      'Unlawfully at large',
    )
  })

  it('returns Recalled - Unlawfully at large when the prisoner is recalled and UAL', async () => {
    const prisoner: Prisoner = {
      lastMovementReasonCode: 'UAL',
      recall: true,
    }

    await expect(getStatusTag(personalDetails, createSupervisionPackage(), prisoner)).resolves.toBe(
      'Recalled - Unlawfully at large',
    )
  })

  it('returns undefined when a primary custodial sentence exists but prisoner details are unavailable', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            type: {
              code: 'SC',
              description: 'Custodial',
              isCustodial: true,
            },
          }),
        ],
      },
    })

    await expect(getStatusTag(personalDetails, supervisionPackage)).resolves.toBe(undefined)
  })

  it('returns In breach when a primary community sentence is in breach', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            inBreach: true,
          }),
        ],
      },
    })

    await expect(getStatusTag(personalDetails, supervisionPackage)).resolves.toBe('In breach')
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

    await expect(getStatusTag(personalDetails, supervisionPackage)).resolves.toBeUndefined()
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

    await expect(getStatusTag(personalDetails, supervisionPackage)).resolves.toBeUndefined()
  })

  it('returns undefined when the supervision package outcome is not success', async () => {
    const supervisionPackage = createSupervisionPackage({
      outcome: 'failure',
    })

    await expect(getStatusTag(personalDetails, supervisionPackage)).resolves.toBeUndefined()
  })

  it('prioritises a determined prisoner status over a community breach', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            inBreach: true,
          }),
        ],
      },
    })

    const prisoner: Prisoner = {
      status: 'ACTIVE IN',
      recall: false,
    }

    await expect(getStatusTag(personalDetails, supervisionPackage, prisoner)).resolves.toBe('In custody')
  })

  it('does not return a custody status for a non-custodial sentence when prisoner status is unknown', async () => {
    const supervisionPackage = createSupervisionPackage()

    await expect(getStatusTag(personalDetails, supervisionPackage)).resolves.toBeUndefined()
  })
})

describe('getStatusTagForPersonInCustody', () => {
  it('returns In custody for an active prisoner who is not recalled', async () => {
    const prisoner: Prisoner = {
      status: 'ACTIVE IN',
      recall: false,
    }

    await expect(getStatusTagForPersonInCustody(prisoner)).resolves.toBe('In custody')
  })

  it('returns In custody for an active-out prisoner who is not recalled', async () => {
    const prisoner: Prisoner = {
      status: 'ACTIVE OUT',
      recall: false,
    }

    await expect(getStatusTagForPersonInCustody(prisoner)).resolves.toBe('In custody')
  })

  it.each(['ACTIVE IN', 'ACTIVE OUT'])(
    'returns Recalled - In custody when status is %s and the prisoner is recalled',
    async status => {
      const prisoner: Prisoner = {
        status,
        recall: true,
      }

      await expect(getStatusTagForPersonInCustody(prisoner)).resolves.toBe('Recalled - In custody')
    },
  )

  it('returns Deceased when legal status is DEAD', async () => {
    const prisoner: Prisoner = {
      legalStatus: 'DEAD',
      status: 'ACTIVE IN',
      recall: false,
    }

    await expect(getStatusTagForPersonInCustody(prisoner)).resolves.toBe('Deceased')
  })

  it('returns Unlawfully at large when the last movement reason is UAL', async () => {
    const prisoner: Prisoner = {
      lastMovementReasonCode: 'UAL',
      recall: false,
    }

    await expect(getStatusTagForPersonInCustody(prisoner)).resolves.toBe('Unlawfully at large')
  })

  it('returns Recalled - Unlawfully at large when the prisoner is recalled and UAL', async () => {
    const prisoner: Prisoner = {
      lastMovementReasonCode: 'UAL',
      recall: true,
    }

    await expect(getStatusTagForPersonInCustody(prisoner)).resolves.toBe('Recalled - Unlawfully at large')
  })

  it('returns undefined when prisoner details are not supplied', async () => {
    await expect(getStatusTagForPersonInCustody()).resolves.toBeUndefined()
  })

  it('returns undefined when the prisoner has no matching status', async () => {
    const prisoner: Prisoner = {
      status: 'INACTIVE',
      legalStatus: 'SENTENCED',
      lastMovementReasonCode: 'ADM',
      recall: false,
    }

    await expect(getStatusTagForPersonInCustody(prisoner)).resolves.toBeUndefined()
  })

  it('returns Unlawfully at large when a primary sentence has custody location code UATLRG', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            custody: {
              location: {
                code: 'UATLRG',
              },
            },
          }),
        ],
      },
    })

    await expect(getStatusTag(createPersonalDetails(), supervisionPackage)).resolves.toBe('Unlawfully at large')
  })

  it('returns detained when a primary sentence has restricted custody status D', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            custody: {
              status: {
                code: 'D',
                description: 'Detained',
              },
            },
          }),
        ],
      },
    })

    await expect(getStatusTag(createPersonalDetails(), supervisionPackage)).resolves.toBe('Detained')
  })

  it('does not return In custody for an unrestricted custody status', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            custody: {
              status: {
                code: 'A',
                description: 'Active',
              },
            },
          }),
        ],
      },
    })

    await expect(getStatusTag(createPersonalDetails(), supervisionPackage)).resolves.toBeUndefined()
  })

  it('does not return Unlawfully at large when only a non-primary sentence has custody location UATLRG', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            isPrimarySentence: false,
            custody: {
              location: {
                code: 'UATLRG',
              },
            },
          }),
        ],
      },
    })

    await expect(getStatusTag(createPersonalDetails(), supervisionPackage)).resolves.toBeUndefined()
  })

  it('does not return In custody when only a non-primary sentence has a restricted custody status', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            isPrimarySentence: false,
            custody: {
              status: {
                code: 'D',
                description: 'Detained',
              },
            },
          }),
        ],
      },
    })

    await expect(getStatusTag(createPersonalDetails(), supervisionPackage)).resolves.toBeUndefined()
  })

  it('prioritises Unlawfully at large over restricted custody status', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            custody: {
              location: {
                code: 'UATLRG',
              },
              status: {
                code: 'D',
                description: 'Detained',
              },
            },
          }),
        ],
      },
    })

    await expect(getStatusTag(createPersonalDetails(), supervisionPackage)).resolves.toBe('Unlawfully at large')
  })

  it('prioritises Unlawfully at large over community sentence breach', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            inBreach: true,
            custody: {
              location: {
                code: 'UATLRG',
              },
            },
          }),
        ],
      },
    })

    await expect(getStatusTag(createPersonalDetails(), supervisionPackage)).resolves.toBe('Unlawfully at large')
  })

  it('prioritises restricted custody status over community sentence breach', async () => {
    const supervisionPackage = createSupervisionPackage({
      context: {
        sentences: [
          createSentence({
            inBreach: true,
            custody: {
              status: {
                code: 'R',
                description: 'Restricted',
              },
            },
          }),
        ],
      },
    })

    await expect(getStatusTag(createPersonalDetails(), supervisionPackage)).resolves.toBe('Restricted')
  })

  it('does not return Unlawfully at large when the supervision package outcome is not success', async () => {
    const supervisionPackage = createSupervisionPackage({
      outcome: 'failure',
      context: {
        sentences: [
          createSentence({
            custody: {
              location: {
                code: 'UATLRG',
              },
            },
          }),
        ],
      },
    })

    await expect(getStatusTag(createPersonalDetails(), supervisionPackage)).resolves.toBeUndefined()
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

  it('returns null when the Prisoner Search API returns null', async () => {
    prisonerSearchApiClient.getPrisonerDetails.mockResolvedValue(null)

    await expect(getPrisonerDetails('token', 'A1234BC', 'X123456')).resolves.toBeNull()
  })
})
