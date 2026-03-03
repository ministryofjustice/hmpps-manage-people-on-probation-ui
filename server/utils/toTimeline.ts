import { RiskScoresDto, TimelineItem, ScoreType } from '../data/model/risk'
import { dateWithYearShortMonthAndTime } from './dateWithYearShortMonthAndTime'
import { toDate } from './toDate'

export const toTimeline = (riskScores: RiskScoresDto[]): TimelineItem[] => {
  const sorted = [...riskScores].sort((a, b) => +toDate(b.completedDate) - +toDate(a.completedDate))
  return sorted.map(riskScore => {
    const scores = {
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
    return { date: dateWithYearShortMonthAndTime(riskScore.completedDate), scores }
  })
}
