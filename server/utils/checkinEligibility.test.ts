import {
  isRegisteredForCheckins,
  isTierBasedEligibility,
  isTierMissing,
  mayBeEligibleMessage,
  noTierEligibilityMessage,
  resolveCheckinEligibility,
} from './checkinEligibility'
import { OffenderEligibility } from '../data/model/esupervision'
import { TierCalculation } from '../data/tierApiClient'

const tier = { tierScore: 'B2' } as TierCalculation
const eligible: OffenderEligibility = { outcome: 'ELIGIBLE', message: 'They are eligible for online check ins.' }
const tierBased: OffenderEligibility = { outcome: 'ELIGIBLE', message: 'Alice Baker are in Tiers D-G.' }
const ineligible: OffenderEligibility = { outcome: 'INELIGIBLE', message: 'Alice Baker are in Tiers A-C.' }
const noTier: OffenderEligibility = {
  outcome: 'INELIGIBLE',
  message: 'Steve Jones is not eligible for online check ins because they have not been assigned a tier yet.',
}
const mayBeEligible: OffenderEligibility = {
  outcome: 'ELIGIBLE',
  message: 'Steve Jones may be eligible for online check ins.',
}

describe('utils/checkinEligibility', () => {
  describe('isTierMissing', () => {
    it.each([
      ['undefined', undefined, true],
      ['null', null, true],
      ['an empty tier score', { tierScore: '' } as TierCalculation, true],
      ['a MISSING tier score', { tierScore: 'MISSING' } as TierCalculation, true],
      [
        'a default score with data.tier MISSING',
        { tierScore: 'D2', data: { tier: 'MISSING' } } as TierCalculation,
        true,
      ],
      ['a score with data.tier assigned', { tierScore: 'B2', data: { tier: 'B2' } } as TierCalculation, false],
      ['a tier score', tier, false],
      ['an error summary', { errors: [{ text: 'Tier unavailable' }] }, false],
    ])('returns %s for %s', (_, value, expected) => {
      expect(isTierMissing(value)).toBe(expected)
    })
  })

  describe('isTierBasedEligibility', () => {
    it.each([
      ['an eligible tier range message', tierBased, true],
      ['a single tier message', { outcome: 'ELIGIBLE', message: 'Someone is in Tier D.' } as OffenderEligibility, true],
      ['a definite eligible message', eligible, false],
      ['an ineligible tier message', ineligible, false],
      ['a null message', { outcome: 'ELIGIBLE', message: null } as OffenderEligibility, false],
      ['no eligibility', null, false],
    ])('returns %s for %s', (_, value, expected) => {
      expect(isTierBasedEligibility(value)).toBe(expected)
    })
  })

  describe('resolveCheckinEligibility', () => {
    it('returns the eligibility unchanged when a tier is assigned and the message is definite', () => {
      expect(resolveCheckinEligibility(eligible, tier, 'Steve Jones')).toBe(eligible)
    })

    it('returns the eligibility unchanged when the tier lookup failed', () => {
      expect(resolveCheckinEligibility(eligible, { errors: [] }, 'Steve Jones')).toBe(eligible)
    })

    it('returns an unknown result unchanged when a tier is assigned', () => {
      const unknown: OffenderEligibility = {
        outcome: 'UNKNOWN',
        message: 'Joe Bloggs may be eligible for online check ins.',
      }
      expect(resolveCheckinEligibility(unknown, tier, 'Joe Bloggs')).toBe(unknown)
    })

    it('returns an ineligible result unchanged', () => {
      expect(resolveCheckinEligibility(ineligible, tier, 'Steve Jones')).toBe(ineligible)
    })

    it('softens a tier-based eligible message to may be eligible', () => {
      expect(resolveCheckinEligibility(tierBased, tier, 'Steve Jones')).toEqual(mayBeEligible)
    })

    it('overrides the eligibility when no tier is assigned', () => {
      expect(resolveCheckinEligibility(eligible, null, 'Steve Jones')).toEqual(noTier)
    })

    it('prefers the no tier message over the tier-based message', () => {
      expect(resolveCheckinEligibility(tierBased, null, 'Steve Jones')).toEqual(noTier)
    })

    it('overrides a missing eligibility when no tier is assigned', () => {
      expect(resolveCheckinEligibility(null, undefined, 'Steve Jones')).toEqual(noTier)
    })

    it.each(['VERIFIED', 'INACTIVE'] as const)(
      'does not override the eligibility when no tier is assigned but check ins are already %s',
      status => {
        expect(resolveCheckinEligibility(eligible, null, 'Steve Jones', status)).toBe(eligible)
      },
    )

    it('still overrides the eligibility when no tier is assigned and check ins are not set up', () => {
      expect(resolveCheckinEligibility(eligible, null, 'Steve Jones', 'INITIAL')).toEqual(noTier)
      expect(resolveCheckinEligibility(eligible, null, 'Steve Jones', null)).toEqual(noTier)
    })

    it('still softens a tier-based message when check ins are already set up', () => {
      expect(resolveCheckinEligibility(tierBased, null, 'Steve Jones', 'VERIFIED')).toEqual(mayBeEligible)
    })
  })

  describe('isRegisteredForCheckins', () => {
    it.each([
      ['VERIFIED', true],
      ['INACTIVE', true],
      ['INITIAL', false],
      [null, false],
      [undefined, false],
    ] as const)('returns the expected result for status %s', (status, expected) => {
      expect(isRegisteredForCheckins(status)).toBe(expected)
    })
  })

  it('noTierEligibilityMessage includes the full name', () => {
    expect(noTierEligibilityMessage('Steve Jones')).toBe(noTier.message)
  })

  it('mayBeEligibleMessage includes the full name', () => {
    expect(mayBeEligibleMessage('Steve Jones')).toBe(mayBeEligible.message)
  })
})
