import { RiskScoresDto, TimelineItem } from '../data/model/risk'
import { dateWithYearShortMonthAndTime } from './dateWithYearShortMonthAndTime'
import { toDate } from './toDate'

export const toTimeline = (riskScores: RiskScoresDto[]): TimelineItem[] => {
  const sorted = [...riskScores].sort((a, b) => +toDate(b.completedDate) - +toDate(a.completedDate))
  return sorted.map(riskScore => {
    const scores = {
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
    return { date: dateWithYearShortMonthAndTime(riskScore.completedDate), scores }
  })
}
