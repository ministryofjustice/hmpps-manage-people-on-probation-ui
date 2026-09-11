import { RiskFlag } from '../data/model/risk'
import { toSentenceCase } from './toSentenceCase'
import logger from '../../logger'

const riskLevelBadgeClass: Record<string, string> = {
  'VERY HIGH': 'risk-badge--very-high', // #711A0D
  HIGH: 'risk-badge--high', // #D4351C
  MEDIUM: 'risk-badge--medium', // #F2590D
  LOW: 'risk-badge--low', // #85994B
}

export const registerTypes = {
  publicProtection: [
    { code: 'REG15', description: 'Risk to Known Adult' },
    { code: 'REG16', description: 'Risk to Prisoner' },
    { code: 'REG17', description: 'Risk to Public' },
    { code: 'REG26', description: 'Organised Crime' },
    { code: 'RCHD', description: 'Risk to Children' },
    { code: 'RTPS', description: 'Risk to Probation Staff' },
    { code: 'AV2S', description: 'Risk to Staff' },
    { code: 'RSC', description: 'Sexual Conviction' },
    {
      code: 'SHPO',
      description: 'Sexual Harm Prevention Order / Sexual Risk Order',
    },
    { code: 'RTAO', description: 'Terrorism Act Offender' },
    { code: 'WEAP', description: 'Weapons' },
    { code: 'STRG', description: 'Street Gangs' },
    { code: 'COC', description: 'Organised Crime - Overt' },
    { code: 'CUCK', description: 'Cuckooing - Potential Victim' },
  ],

  safeguardingRisk: [
    { code: 'BWWA', description: 'Barred from working with Adults' },
    { code: 'ADWC', description: 'Barred from working with Children' },
    { code: 'CL1', description: 'County Lines - Perpetrator' },
    { code: 'CL2', description: 'County Lines - Victim' },
    {
      code: 'CCE',
      description: 'Child Criminal Exploitation (CCE) perpetrator',
    },
    {
      code: 'CSEP',
      description: 'Child Sexual Exploitation - Perpetrator',
    },
    { code: 'MSP', description: 'Modern Slavery - Perpetrator' },
    { code: 'MSV', description: 'Modern Slavery - Victim' },
    { code: 'DASO', description: 'Domestic Abuse Safety Officer' },
    { code: 'ADVP', description: 'Domestic Abuse' },
    { code: 'COR', description: 'Corruptor' },
    { code: 'CYB1', description: 'Cyber - Enabled' },
    { code: 'CYB2', description: 'Cyber - Dependent' },
  ],

  alerts: [
    { code: 'ALERT', description: 'Alert Notice' },
    { code: 'PRC', description: 'Contact Suspended' },
    { code: 'ICC', description: 'Information on Closed Case' },
    { code: 'HOIE', description: 'Home Office Interest' },
    { code: 'RCCO', description: 'Child Concerns' },
    { code: 'RSTO', description: 'Restraining Order' },
    { code: 'WRSM', description: 'Warrant / Summons' },
    { code: 'INLL', description: 'Lifer' },
  ],

  safeguardingNeed: [
    { code: 'RVAD', description: 'Safeguarding - "Adult At Risk"' },
    { code: 'RCPR', description: 'Child Protection' },
    { code: 'ADVV', description: 'Domestic Abuse Victim' },
    { code: 'INVI', description: 'Victim Contact' },
    { code: 'IMAR', description: 'MARAC' },
    { code: 'ALSH', description: 'Suicide/Self Harm' },
  ],

  cohort: [
    { code: 'MAPP', description: 'MAPPA' },
    { code: 'IIOM', description: 'Integrated Offender Management' },
    { code: 'SSS', description: 'Short Sentence Service' },
    { code: 'GA', description: 'Grand Avenues Cohort' },
    { code: 'JIP', description: 'Joint Intelligence Programme' },
    {
      code: 'DORIS',
      description: 'DoRIS (Disruption of Recorded Internal Secretors)',
    },
  ],
}

const riskLevelPriority: Record<string, number> = {
  'VERY HIGH': 10,
  HIGH: 20,
  MEDIUM: 30,
  LOW: 40,
}

const registerTypePriority = ['publicProtection', 'safeguardingRisk', 'alerts', 'safeguardingNeed', 'cohort'] as const

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

const MAX_RISK_BADGES = 7

const riskDescriptionPriority = new Map(
  registerTypePriority.flatMap((registerType, categoryIndex) =>
    registerTypes[registerType].map((register, descriptionIndex) => [
      register.description.trim().toLowerCase(),
      categoryIndex * 1000 + descriptionIndex,
    ]),
  ),
)

function getRiskRegisterType(description: string): string | undefined {
  const normalisedDescription = description.trim().toLowerCase()

  return registerTypePriority.find(registerType =>
    registerTypes[registerType].some(register => register.description.trim().toLowerCase() === normalisedDescription),
  )
}

function getRiskDescriptionPriority(description: string): number {
  const normalisedDescription = description.trim().toLowerCase()
  const priority = riskDescriptionPriority.get(normalisedDescription)

  if (priority === undefined) {
    logger.info(`Unexpected risk flag description received: "${description}"`)
    return Number.MAX_SAFE_INTEGER
  }

  return priority
}

export function getRiskBadgeGroups(riskFlags: RiskFlag[]): RiskBadgeData {
  const activeRiskFlags = riskFlags.filter(flag => !flag.removed)

  const sortedRiskFlags = [...activeRiskFlags].sort((a, b) => {
    const severityPriority =
      (riskLevelPriority[a.level ?? ''] ?? Number.MAX_SAFE_INTEGER) -
      (riskLevelPriority[b.level ?? ''] ?? Number.MAX_SAFE_INTEGER)

    if (severityPriority !== 0) {
      return severityPriority
    }

    return getRiskDescriptionPriority(a.description) - getRiskDescriptionPriority(b.description)
  })

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

    const registerType = getRiskRegisterType(flag.description)

    group.badges.push({
      id: flag.id,
      text:
        registerType === 'publicProtection'
          ? `${toSentenceCase(flag.description, [], null, true, false)} - ${toSentenceCase(severity, [], null, true, false)}`
          : toSentenceCase(flag.description, [], null, true, false),
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
