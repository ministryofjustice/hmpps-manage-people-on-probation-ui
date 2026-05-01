import { TimelineItem } from '../../data/model/risk'

export const mockPredictorScores: TimelineItem = {
  date: '8 Oct 2025 at 4:25pm',
  scores: {
    RSR: { type: 'RSR', level: 'HIGH', score: 99.86 },
    OGP: { type: 'OGP', level: 'MEDIUM', oneYear: 43, twoYears: 58 },
    OSPC: { type: 'OSP/C', level: 'VERY_HIGH', score: 75.3 },
    OSPI: { type: 'OSP/I', level: 'HIGH', score: 10.31 },
    OGRS: { type: 'OGRS', level: 'LOW', oneYear: 21, twoYears: 35 },
    OVP: { type: 'OVP', level: 'HIGH', oneYear: 54, twoYears: 69 },
  },
}
