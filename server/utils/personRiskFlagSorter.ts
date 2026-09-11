import { RiskFlag } from '../data/model/risk'

const riskLevelBadgeClass: Record<string, string> = {
  'VERY HIGH': 'risk-badge--very-high', // #711A0D
  HIGH: 'risk-badge--high', // #D4351C
  MEDIUM: 'risk-badge--medium', // #F2590D
  LOW: 'risk-badge--low', // #85994B
}

const riskLevelPriority: Record<string, number> = {
  'VERY HIGH': 10,
  HIGH: 20,
  MEDIUM: 30,
  LOW: 40,
}

interface RiskFlagBadgeData {
  id: number
  description: string
  level?: string
  [key: string]: unknown
}

interface RiskBadge {
  id: number
  text: string
  level: string
  badgeClass: string
}

interface RiskBadgeGroup {
  severity: string
  badges: RiskBadge[]
}


export interface RiskBadgeData {
  groups: RiskBadgeGroup[]
  remainingCount: number
}

export function getRiskBadgeGroups(riskFlags: RiskFlag[]): RiskBadgeData {
  const activeRiskFlags = riskFlags.filter(flag => !flag.removed)

  const sortedRiskFlags = [...activeRiskFlags].sort(
    (a, b) =>
      (riskLevelPriority[a.level ?? ''] ?? Number.MAX_SAFE_INTEGER) -
      (riskLevelPriority[b.level ?? ''] ?? Number.MAX_SAFE_INTEGER),
  )

  const visibleRiskFlags = sortedRiskFlags.slice(0, MAX_RISK_BADGES)

  const groups = visibleRiskFlags.reduce<RiskBadgeGroup[]>((result, flag) => {
    const severity = flag.level ?? 'LOW'

    let group = result.find(item => item.severity === severity)

    if (!group) {
      group = {
        severity,
        badges: [],
      }

      result.push(group)
    }

    group.badges.push({
      id: flag.id,
      text: flag.description,
      level: severity,
      badgeClass: riskLevelBadgeClass[severity],
    })

    return result
  }, [])

  return {
    groups,
    remainingCount: Math.max(sortedRiskFlags.length - MAX_RISK_BADGES, 0),
  }
}
const MAX_RISK_BADGES = 7