import { toPredictors } from './toPredictors'
import { riskScores as predictorScores } from './mocks'
import { RiskScoresDto, TimelineItem, ScoreType } from '../data/model/risk'

const getExpectedScores = (riskScore: RiskScoresDto) => {
  return {
    RSR: {
      type: 'Combined Serious Reoffending Predictor',
      level: riskScore.riskOfSeriousRecidivismScore?.scoreLevel,
      score: riskScore.riskOfSeriousRecidivismScore?.percentageScore,
      staticOrDynamic: 'Dynamic' as ScoreType,
    },
    OGP: {
      type: 'OASys General Predictor Score',
      level: riskScore.generalPredictorScore?.ogpRisk,
      oneYear: riskScore.generalPredictorScore?.ogp1Year,
      twoYears: riskScore.generalPredictorScore?.ogp2Year,
      staticOrDynamic: 'Dynamic' as ScoreType,
    },
    OSPC: {
      type: 'Direct Contact - Sexual Reoffending Predictor',
      level:
        riskScore.sexualPredictorScore?.ospContactScoreLevel ||
        riskScore.sexualPredictorScore?.ospDirectContactScoreLevel,
      score:
        riskScore.sexualPredictorScore?.ospContactPercentageScore ||
        riskScore.sexualPredictorScore?.ospDirectContactPercentageScore,
      staticOrDynamic: 'Static' as ScoreType,
    },
    OSPI: {
      type: 'Images and Indirect Contact - Sexual Reoffending Predictor',
      level:
        riskScore.sexualPredictorScore?.ospIndecentScoreLevel ||
        riskScore.sexualPredictorScore?.ospIndirectImageScoreLevel,
      score:
        riskScore.sexualPredictorScore?.ospIndecentPercentageScore ||
        riskScore.sexualPredictorScore?.ospIndirectImagePercentageScore,
      staticOrDynamic: 'Static' as ScoreType,
    },
    OGRS: {
      type: 'All Reoffending Predictor',
      level: riskScore.groupReconvictionScore?.scoreLevel,
      oneYear: riskScore.groupReconvictionScore?.oneYear,
      twoYears: riskScore.groupReconvictionScore?.twoYears,
      staticOrDynamic: 'Static' as ScoreType,
    },
    OVP: {
      type: 'Violent Reoffending Predictor',
      level: riskScore.violencePredictorScore?.ovpRisk,
      oneYear: riskScore.violencePredictorScore?.oneYear,
      twoYears: riskScore.violencePredictorScore?.twoYears,
      staticOrDynamic: 'Dynamic' as ScoreType,
    },
  }
}

describe('utils/toPredictors', () => {
  const expected: TimelineItem = { date: '9 Dec 2024 at 8:13am', scores: getExpectedScores(predictorScores[0]) }
  it('should return the predictor scores in date order', () => {
    expect(toPredictors(predictorScores)).toStrictEqual(expected)
  })
})
