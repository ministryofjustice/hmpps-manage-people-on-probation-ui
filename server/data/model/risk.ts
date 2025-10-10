import { Name, PersonSummary } from './personalDetails'
import { Note } from './note'
import { ErrorSummaryItem } from './common'

export interface TimelineItem {
  date: string
  scores: Scores
}

export interface Scores {
  RSR: Score
  OSPC: Score
  OSPI: Score
  OGRS: ScoreTwoYears
  OVP: ScoreTwoYears
  OGP: ScoreTwoYears
}

export interface Score {
  type: string
  level: string
  score: number
}

export interface ScoreTwoYears {
  type: string
  level: string
  oneYear: number
  twoYears: number
}

export interface RoshRiskWidgetDto {
  overallRisk?: string
  assessedOn?: string
  risks: { riskTo: string; community: string | string[]; custody: string | string[] }[]
}

export interface RiskScoresDto {
  completedDate?: string
  assessmentStatus?: string
  groupReconvictionScore?: OgrScoreDto
  violencePredictorScore?: OvpScoreDto
  generalPredictorScore?: OgpScoreDto
  riskOfSeriousRecidivismScore?: RsrScoreDto
  sexualPredictorScore?: OspScoreDto
}

export interface Mappa {
  level?: number
  category?: number
  categoryDescription?: string
  startDate?: string
  reviewDate?: string
}

export interface Opd {
  eligible?: boolean
  date?: string
}

export interface OgrScoreDto {
  oneYear?: number
  twoYears?: number
  scoreLevel?: ScoreLevelEnum
}

export interface OspScoreDto {
  ospIndecentPercentageScore?: number
  ospContactPercentageScore?: number
  ospIndecentScoreLevel?: ScoreLevelEnum
  ospContactScoreLevel?: ScoreLevelEnum
  ospIndirectImagePercentageScore?: number
  ospDirectContactPercentageScore?: number
  ospIndirectImageScoreLevel?: ScoreLevelEnum
  ospDirectContactScoreLevel?: ScoreLevelEnum
}

export interface OvpScoreDto {
  ovpStaticWeightedScore?: number
  ovpDynamicWeightedScore?: number
  ovpTotalWeightedScore?: number
  oneYear?: number
  twoYears?: number
  ovpRisk?: RiskEnum
}

export interface OgpScoreDto {
  ogpStaticWeightedScore?: number
  ogpDynamicWeightedScore?: number
  ogpTotalWeightedScore?: number
  ogp1Year?: number
  ogp2Year?: number
  ogpRisk?: RiskEnum
}

export interface RsrScoreDto {
  percentageScore?: number
  staticOrDynamic?: StaticOrDynamicEnum
  source: SourceEnum
  algorithmVersion?: string
  scoreLevel?: ScoreLevelEnum
}

export type RiskEnum = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'NOT_APPLICABLE'
export type ScoreLevelEnum = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'NOT_APPLICABLE'
export type StaticOrDynamicEnum = 'STATIC' | 'DYNAMIC'
export type SourceEnum = 'OASYS'

export interface PersonRiskFlags {
  personSummary: PersonSummary
  opd: Opd
  mappa: Mappa
  riskFlags: RiskFlag[]
  removedRiskFlags: RiskFlag[]
}

export interface PersonRiskFlag {
  personSummary: PersonSummary
  riskFlag: RiskFlag
}

export interface RemovalHistory {
  notes?: string
  removalDate: string
  removedBy: Name
}

export interface RiskFlag {
  id: number
  description: string
  levelDescription?: string
  level?: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATION_ONLY'
  riskNotes?: Note[]
  riskNote?: Note
  nextReviewDate?: string
  mostRecentReviewDate?: string
  createdDate: string
  createdBy: Name
  removed: boolean
  removalHistory: RemovalHistory[]
}

export type RiskScore = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'

export type RiskResponse = 'YES' | 'NO' | 'DK'

export interface Risk {
  [index: string]: string
  risk: RiskResponse | null
  current: RiskResponse | null
  currentConcernsText: string | null
  previous?: RiskResponse | null
  previousConcernsText?: string | null
}

export interface RiskToSelf {
  [index: string]: Risk
  suicide?: Risk | null
  selfHarm?: Risk | null
  custody?: Risk | null
  hostelSetting?: Risk | null
  vulnerability?: Risk | null
}

export interface RiskSummary {
  errors?: ErrorSummaryItem[]
  riskToSelf?: RiskToSelf
  summary?: {
    whoIsAtRisk?: string | null
    natureOfRisk?: string | null
    riskImminence?: string | null
    riskIncreaseFactors?: string | null
    riskMitigationFactors?: string | null
    riskInCommunity?: Partial<Record<RiskScore, string[]>>
    riskInCustody?: Partial<Record<RiskScore, string[]>>
    overallRiskLevel: RiskScore
  }
  assessedOn?: string | null
}

export interface Needs {
  identifiedNeeds: Need[]
}

export interface Need {
  section: string
  name: string
  riskOfHarm: boolean
  riskOfReoffending: boolean
  severity: string
}
