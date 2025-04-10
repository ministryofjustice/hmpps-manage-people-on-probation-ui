import { ErrorSummary } from '../data/model/common'
import { RiskScoresDto, TimelineItem } from '../data/model/risk'
import { toTimeline } from './toTimeline'

export const toPredictors = (predictors: RiskScoresDto[] | ErrorSummary | null): TimelineItem => {
  let timeline: TimelineItem[] = []
  let predictorScores
  if (Array.isArray(predictors)) {
    timeline = toTimeline(predictors)
  }
  if (timeline.length > 0) {
    ;[predictorScores] = timeline
  }
  return predictorScores
}
