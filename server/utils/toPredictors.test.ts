import { toPredictors } from './toPredictors'
import { riskScores as predictorScores } from './mocks'
import { RiskScoresDto, TimelineItem } from '../data/model/risk'

const getExpectedScores = (riskScore: RiskScoresDto) => {
  return {
    RSR: {
      type: 'RSR',
      level: riskScore.riskOfSeriousRecidivismScore?.scoreLevel,
      score: riskScore.riskOfSeriousRecidivismScore?.percentageScore,
    },
    OGP: {
      type: 'OGP',
      level: riskScore.generalPredictorScore?.ogpRisk,
      oneYear: riskScore.generalPredictorScore?.ogp1Year,
      twoYears: riskScore.generalPredictorScore?.ogp2Year,
    },
    OSPC: {
      type: 'OSP/C',
      level:
        riskScore.sexualPredictorScore?.ospContactScoreLevel ||
        riskScore.sexualPredictorScore?.ospDirectContactScoreLevel,
      score:
        riskScore.sexualPredictorScore?.ospContactPercentageScore ||
        riskScore.sexualPredictorScore?.ospDirectContactPercentageScore,
    },
    OSPI: {
      type: 'OSP/I',
      level:
        riskScore.sexualPredictorScore?.ospIndecentScoreLevel ||
        riskScore.sexualPredictorScore?.ospIndirectImageScoreLevel,
      score:
        riskScore.sexualPredictorScore?.ospIndecentPercentageScore ||
        riskScore.sexualPredictorScore?.ospIndirectImagePercentageScore,
    },
    OGRS: {
      type: 'OGRS',
      level: riskScore.groupReconvictionScore?.scoreLevel,
      oneYear: riskScore.groupReconvictionScore?.oneYear,
      twoYears: riskScore.groupReconvictionScore?.twoYears,
    },
    OVP: {
      type: 'OVP',
      level: riskScore.violencePredictorScore?.ovpRisk,
      oneYear: riskScore.violencePredictorScore?.oneYear,
      twoYears: riskScore.violencePredictorScore?.twoYears,
    },
  }
}

describe('utils/toPredictors', () => {
  const expected: TimelineItem = { date: '9 Dec 2024 at 8:13am', scores: getExpectedScores(predictorScores[0]) }
  it('should return the predictor scores in date order', () => {
    expect(toPredictors(predictorScores)).toStrictEqual(expected)
  })
})
