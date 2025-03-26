import { TierCalculation } from '../../data/tierApiClient'

export const mockTierCalculation = {
  tierScore: 'B2',
  calculationId: 'ee1f151f-7417-47f8-9366-2ced6356db37',
  calculationDate: '2023-12-07T12:05:11.524616',
  data: {
    protect: {
      tier: 'B',
      points: 33,
      pointsBreakdown: {
        RSR: 20,
        ROSH: 10,
        MAPPA: 5,
        COMPLEXITY: 2,
        ADDITIONAL_FACTORS_FOR_WOMEN: 6,
      },
    },
    change: {
      tier: 'TWO',
      points: 14,
      pointsBreakdown: {
        NEEDS: 7,
        IOM: 2,
        OGRS: 5,
      },
    },
    calculationVersion: '2',
  },
} as unknown as TierCalculation
