import { RiskScoresDto } from '../../data/model/risk'

export const riskScores: RiskScoresDto[] = [
  {
    completedDate: '2024-12-09T08:13:33',
    assessmentStatus: 'string',
    groupReconvictionScore: {
      oneYear: 3,
      twoYears: 6,
      scoreLevel: 'LOW',
    },
    violencePredictorScore: {
      ovpStaticWeightedScore: 0,
      ovpDynamicWeightedScore: 0,
      ovpTotalWeightedScore: 0,
      oneYear: 4,
      twoYears: 10.2,
      ovpRisk: 'MEDIUM',
    },
    generalPredictorScore: {
      ogpStaticWeightedScore: 0,
      ogpDynamicWeightedScore: 0,
      ogpTotalWeightedScore: 0,
      ogp1Year: 5,
      ogp2Year: 28.8,
      ogpRisk: 'HIGH',
    },
    riskOfSeriousRecidivismScore: {
      percentageScore: 12.1,
      staticOrDynamic: 'STATIC',
      source: 'OASYS',
      algorithmVersion: 'string',
      scoreLevel: 'MEDIUM',
    },
    sexualPredictorScore: {
      ospIndecentPercentageScore: 31.1,
      ospContactPercentageScore: 2.1,
      ospIndecentScoreLevel: 'HIGH',
      ospContactScoreLevel: 'LOW',
      ospIndirectImagePercentageScore: 0,
      ospDirectContactPercentageScore: 12.9,
      ospIndirectImageScoreLevel: 'MEDIUM',
      ospDirectContactScoreLevel: 'HIGH',
    },
  },
  {
    completedDate: '2024-11-01T18:56:33',
    assessmentStatus: 'string',
    groupReconvictionScore: {
      oneYear: 5,
      twoYears: 6,
      scoreLevel: 'LOW',
    },
    violencePredictorScore: {
      ovpStaticWeightedScore: 0,
      ovpDynamicWeightedScore: 0,
      ovpTotalWeightedScore: 0,
      oneYear: 0,
      twoYears: 0,
      ovpRisk: 'LOW',
    },
    generalPredictorScore: {
      ogpStaticWeightedScore: 0,
      ogpDynamicWeightedScore: 0,
      ogpTotalWeightedScore: 0,
      ogp1Year: 5,
      ogp2Year: 28.8,
      ogpRisk: 'HIGH',
    },
    riskOfSeriousRecidivismScore: {
      percentageScore: 12.1,
      staticOrDynamic: 'STATIC',
      source: 'OASYS',
      algorithmVersion: 'string',
      scoreLevel: 'MEDIUM',
    },
    sexualPredictorScore: {
      ospIndecentPercentageScore: 31.1,
      ospContactPercentageScore: 0,
      ospIndecentScoreLevel: 'HIGH',
      ospContactScoreLevel: 'LOW',
      ospIndirectImagePercentageScore: 0,
      ospDirectContactPercentageScore: 12.9,
      ospIndirectImageScoreLevel: 'MEDIUM',
      ospDirectContactScoreLevel: 'HIGH',
    },
  },
]
