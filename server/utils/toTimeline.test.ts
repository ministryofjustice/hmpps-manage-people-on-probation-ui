import { toTimeline } from './toTimeline'
import { riskScores } from './mocks'
import { RiskScoresDto, ScoreType, TimelineItem } from '../data/model/risk'

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
describe('utils/toTimeline', () => {
  it('should return the date sorted risk scores', () => {
    const expected: TimelineItem[] = [
      { date: '9 Dec 2024 at 8:13am', scores: getExpectedScores(riskScores[0]) },
      { date: '1 Nov 2024 at 6:56pm', scores: getExpectedScores(riskScores[1]) },
    ]
    expect(toTimeline(riskScores)).toStrictEqual(expected)
  })
  it('should return the date sorted risk scores for all conditional values', () => {
    const mock = [
      {
        ...riskScores[0],
        sexualPredictorScore: {
          ...riskScores[0].sexualPredictorScore,
          ospContactScoreLevel: null,
          ospDirectContactScoreLevel: 0,
          ospContactPercentageScore: null,
          ospDirectContactPercentageScore: 0,
          ospIndecentScoreLevel: null,
          ospIndirectImageScoreLevel: 0,
          ospIndecentPercentageScore: null,
          ospIndirectImagePercentageScore: 0,
        },
      },
      { ...riskScores[1] },
    ] as RiskScoresDto[]
    const expected: TimelineItem[] = [
      { date: '9 Dec 2024 at 8:13am', scores: getExpectedScores(mock[0]) },
      { date: '1 Nov 2024 at 6:56pm', scores: getExpectedScores(mock[1]) },
    ]
    expect(toTimeline(mock)).toStrictEqual(expected)
  })
})
