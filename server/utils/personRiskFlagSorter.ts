import { RiskFlag } from '../data/model/risk'
import { toSentenceCase } from './toSentenceCase'

const riskLevelBadgeClass: Record<string, string> = {
  'VERY HIGH': 'risk-badge--very-high',
  HIGH: 'risk-badge--high',
  MEDIUM: 'risk-badge--medium',
  LOW: 'risk-badge--low',
}

const risksWithLevelDescription = new Set([
  'risk to public',
  'risk to known adult',
  'risk to children',
  'risk to staff',
  'risk to prisoner',
])

const lowRiskLevelWithDescription = new Set(['mappa'])

const riskLevelPriority: Record<string, number> = {
  'VERY HIGH': 10,
  HIGH: 20,
  MEDIUM: 30,
  LOW: 40,
}

export const registerTypes = {
  publicProtection: [
    { code: 'AV2S', description: 'Risk to Staff' },
    { code: 'RTPS', description: 'Risk to Probation Staff' },
    { code: 'REG17', description: 'Risk to Public' },
    { code: 'REG26', description: 'Organised Crime' },
    { code: 'RCHD', description: 'Risk to Children' },
    { code: 'REG15', description: 'Risk to Known Adult' },
    { code: 'REG16', description: 'Risk to Prisoner' },
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
    { code: 'ADVP', description: 'Domestic Abuse Perpetrator' },
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

function getRiskDescriptionPriority(description: string, registerType: string | undefined): number {
  if (!registerType) {
    return Number.MAX_SAFE_INTEGER
  }

  const registers = registerTypes[registerType as keyof typeof registerTypes]

  return registers.findIndex(register => register.description.trim().toLowerCase() === description.trim().toLowerCase())
}

const MAX_RISK_BADGES = 7

function getRiskRegisterType(description: string): string | undefined {
  const normalisedDescription = description.trim().toLowerCase()

  return registerTypePriority.find(registerType =>
    registerTypes[registerType].some(register => register.description.trim().toLowerCase() === normalisedDescription),
  )
}

function getRiskLevel(flag: RiskFlag): string {
  const normalisedDescription = flag.description.trim().toLowerCase()

  const level = risksWithLevelDescription.has(normalisedDescription)
    ? (flag.levelDescription ?? flag.level)
    : flag.level

  return (level ?? 'LOW').toUpperCase()
}
function getGroupedRiskBadges(visibleRiskFlags: RiskFlag[]) {
  return visibleRiskFlags.reduce<RiskBadgeGroup[]>((result, flag) => {
    const severity = getRiskLevel(flag)
    let group = result.find(item => item.severity === severity)

    if (!group) {
      group = {
        severity,
        badges: [],
      }

      result.push(group)
    }

    const normalisedDescription = flag.description.trim().toLowerCase()
    const description = toSentenceCase(flag.description, [], null, true, false)
    const displayDescription = description.replace(/^Mappa\b/, 'MAPPA')

    let text = description

    if (lowRiskLevelWithDescription.has(normalisedDescription)) {
      const levelDescription = flag.levelDescription?.replace('MAPPA ', '') ?? ''
      text = `${displayDescription} - ${levelDescription}`
    } else if (risksWithLevelDescription.has(normalisedDescription)) {
      text = `${displayDescription} - ${toSentenceCase(severity, [], null, true, false)}`
    }

    group.badges.push({
      id: flag.id,
      text,
      level: severity,
      badgeClass: riskLevelBadgeClass[severity],
    })

    return result
  }, [])
}

const validRiskDescriptions = new Set(
  Object.values(registerTypes)
    .flat()
    .map(registerType => registerType.description.toLowerCase()),
)

export function getRiskBadgeGroups(riskFlags: RiskFlag[]): RiskBadgeData {
  const activeRiskFlags = riskFlags.filter(
    flag => !flag.removed && validRiskDescriptions.has(flag.description.trim().toLowerCase()),
  )
  const sortedRiskFlags = [...activeRiskFlags].sort((a, b) => {
    const severityPriority =
      (riskLevelPriority[getRiskLevel(a)] ?? Number.MAX_SAFE_INTEGER) -
      (riskLevelPriority[getRiskLevel(b)] ?? Number.MAX_SAFE_INTEGER)

    if (severityPriority !== 0) {
      return severityPriority
    }

    const aRegisterType = getRiskRegisterType(a.description)
    const bRegisterType = getRiskRegisterType(b.description)

    const aRegisterPriority = aRegisterType
      ? registerTypePriority.indexOf(aRegisterType as (typeof registerTypePriority)[number])
      : Number.MAX_SAFE_INTEGER

    const bRegisterPriority = bRegisterType
      ? registerTypePriority.indexOf(bRegisterType as (typeof registerTypePriority)[number])
      : Number.MAX_SAFE_INTEGER

    if (aRegisterPriority !== bRegisterPriority) {
      return aRegisterPriority - bRegisterPriority
    }

    const aDescriptionPriority = getRiskDescriptionPriority(a.description, aRegisterType)
    const bDescriptionPriority = getRiskDescriptionPriority(b.description, bRegisterType)

    return aDescriptionPriority - bDescriptionPriority
  })

  const visibleRiskFlags = sortedRiskFlags.slice(0, MAX_RISK_BADGES)

  const groups = getGroupedRiskBadges(visibleRiskFlags)

  return {
    groups,
    remainingCount: Math.max(sortedRiskFlags.length - MAX_RISK_BADGES, 0),
  }
}
