import ESupervisionClient from '../data/eSupervisionClient'
import { mockTierCalculation } from '../controllers/mocks'
import { getCheckinEligibility } from './getCheckinEligibility'
import { eligibilityCheckDisabled } from './checkinEligibility'
import { OffenderCheckinsByCRNResponse, OffenderEligibility } from '../data/model/esupervision'

jest.mock('../data/eSupervisionClient')

const crn = 'X000001'
const token = 'token-1'
const headerPersonName = { forename: 'Alton', surname: 'Berge' }

const mockOffenderEligibility: OffenderEligibility = {
  outcome: 'ELIGIBLE',
  message: 'This person is eligible for online check ins',
}

const mockCheckinsResponse = {
  uuid: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  crn,
  status: 'VERIFIED',
  firstCheckin: '2025-11-03',
  checkinInterval: 'WEEKLY',
  mode: 'SCHEDULED',
  contactPreference: 'PHONE',
} as OffenderCheckinsByCRNResponse

const getOffenderEligibilitySpy = jest
  .spyOn(ESupervisionClient.prototype, 'getOffenderEligibility')
  .mockImplementation(() => Promise.resolve(mockOffenderEligibility))

const getOffenderCheckinsByCRNSpy = jest
  .spyOn(ESupervisionClient.prototype, 'getOffenderCheckinsByCRN')
  .mockImplementation(() => Promise.resolve(undefined))

describe('utils/getCheckinEligibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return the offender checkins response', async () => {
    getOffenderCheckinsByCRNSpy.mockResolvedValueOnce(mockCheckinsResponse)
    const result = await getCheckinEligibility(token, crn, { flags: { enableEsupEligibilityCheck: false } })
    expect(getOffenderCheckinsByCRNSpy).toHaveBeenCalledWith(crn)
    expect(result.offenderCheckinsByCRNResponse).toEqual(mockCheckinsResponse)
  })

  it('should skip the eligibility check and treat the person as eligible when the flag is off', async () => {
    const result = await getCheckinEligibility(token, crn, {
      flags: { enableEsupEligibilityCheck: false },
      tierCalculation: null,
      headerPersonName,
    })
    expect(getOffenderEligibilitySpy).not.toHaveBeenCalled()
    expect(result.checkinEligibility).toEqual(eligibilityCheckDisabled)
  })

  it('should return the eligibility from the api when the flag is on', async () => {
    const result = await getCheckinEligibility(token, crn, {
      flags: { enableEsupEligibilityCheck: true },
      tierCalculation: mockTierCalculation,
    })
    expect(getOffenderEligibilitySpy).toHaveBeenCalledWith(crn)
    expect(result.checkinEligibility).toEqual(mockOffenderEligibility)
  })

  it('should soften a tier-based eligibility message to may be eligible', async () => {
    getOffenderEligibilitySpy.mockResolvedValueOnce({
      outcome: 'ELIGIBLE',
      message: '    Alton Berge are in Tiers D-G.',
    })
    const result = await getCheckinEligibility(token, crn, {
      flags: { enableEsupEligibilityCheck: true },
      tierCalculation: mockTierCalculation,
      headerPersonName,
    })
    expect(result.checkinEligibility).toEqual({
      outcome: 'ELIGIBLE',
      message: 'Alton Berge may be eligible for online check ins.',
    })
  })

  it('should mark the person as ineligible for check ins when no tier has been assigned', async () => {
    const result = await getCheckinEligibility(token, crn, {
      flags: { enableEsupEligibilityCheck: true },
      tierCalculation: null,
      headerPersonName,
    })
    expect(result.checkinEligibility).toEqual({
      outcome: 'INELIGIBLE',
      message: 'Alton Berge is not eligible for online check ins because they have not been assigned a tier yet.',
    })
  })

  it('should keep the person eligible when no tier has been assigned but they are already set up for check ins', async () => {
    getOffenderCheckinsByCRNSpy.mockResolvedValueOnce(mockCheckinsResponse)
    const result = await getCheckinEligibility(token, crn, {
      flags: { enableEsupEligibilityCheck: true },
      tierCalculation: null,
      headerPersonName,
    })
    expect(result.checkinEligibility).toEqual(mockOffenderEligibility)
  })
})
