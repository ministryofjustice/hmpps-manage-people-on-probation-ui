import { RiskFlag } from '../data/model/risk'
import { toSentenceCase } from './toSentenceCase'
import logger from '../../logger'

const riskLevelBadgeClass: Record<string, string> = {
  'VERY HIGH': 'risk-badge--very-high',
  HIGH: 'risk-badge--high',
  MEDIUM: 'risk-badge--medium',
  LOW: 'risk-badge--low',
}

const riskTypeBadgeClass: Record<string, string> = {
  cohort: 'risk-badge--cohort',
  misc: 'risk-badge--misc',
}

const riskLevelByDescription: Record<string, string> = {
  // LOW
  'county lines - victim': 'LOW',
  'domestic abuse safety officer': 'LOW',
  'home office interest': 'LOW',
  'street gangs': 'LOW',
  // MEDIUM
  'child concerns': 'MEDIUM',
  'victim contact': 'MEDIUM',
  'county lines - perpetrator': 'MEDIUM',
  'cuckooing - potential victim': 'MEDIUM',
  'domestic abuse victim': 'MEDIUM',
  'doris (disruption of recorded internal secretors)': 'MEDIUM',
  'information on closed case': 'MEDIUM',
  'joint intelligence programme': 'MEDIUM',
  'modern slavery - perpetrator': 'MEDIUM',
  'modern slavery - victim': 'MEDIUM',
  'organised crime': 'MEDIUM',
  'restraining order': 'MEDIUM',
  stalking: 'MEDIUM',
  'warrant / summons': 'MEDIUM',

  // HIGH
  'alert notice': 'HIGH',
  'barred from working with adults': 'HIGH',
  'barred from working with children': 'HIGH',
  'child criminal exploitation (cce) perpetrator': 'HIGH',
  'child protection': 'HIGH',
  'child sexual exploitation - perpetrator': 'HIGH',
  corruptor: 'HIGH',
  'domestic abuse': 'HIGH',
  mappa: 'HIGH',
  marac: 'HIGH',
  'safeguarding - "adult at risk"': 'HIGH',
  'sexual conviction': 'HIGH',
  'sexual harm prevention order / sexual risk order': 'HIGH',
  sfo: 'HIGH',
  'suicide/self harm': 'HIGH',
  'terrorism act offender': 'HIGH',
  weapons: 'HIGH',
}

const cohortDescriptions = new Set([
  'contact suspended',
  'cyber - dependent',
  'cyber - enabled',
  'grand avenues cohort',
  'Home Office Interest',
  'lifer - supervised',
  'lifer - not supervised',
  'organised crime - overt',
  'short sentence service',
  'final third excluded',
  'final third - supervision continues',
  'street gangs',
])

const miscDescriptions = new Set(['cppc registered case', 'integrated offender management'])

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
    { code: 'REG17', description: 'Risk to Public' },
    { code: 'REG16', description: 'Risk to Prisoner' },
    { code: 'CPPC', description: 'CPPC registered case' },
    { code: 'ADVP', description: 'Domestic Abuse' },
    { code: 'MAPP', description: 'MAPPA' },
    { code: 'IMAR', description: 'MARAC' },
    { code: 'REG15', description: 'Risk to Known Adult' },
    { code: 'RSC', description: 'Sexual Conviction' },
    { code: 'SPO', description: 'Stalking' },
    { code: 'RTAO', description: 'Terrorism Act Offender' },
  ],

  safeguardingRisk: [
    { code: 'BWWA', description: 'Barred from working with Adults' },
    { code: 'ADWC', description: 'Barred from working with Children' },
    { code: 'RCCO', description: 'Child Concerns' },
    { code: 'CCE', description: 'Child Criminal Exploitation (CCE) perpetrator' },
    { code: 'RCPR', description: 'Child Protection' },
    { code: 'CSEP', description: 'Child Sexual Exploitation - Perpetrator' },
    { code: 'CL1', description: 'County Lines - Perpetrator' },
    { code: 'MSP', description: 'Modern Slavery - Perpetrator' },
    { code: 'RCHD', description: 'Risk to Children' },
  ],

  alerts: [
    { code: 'ALERT', description: 'Alert Notice' },
    { code: 'COR', description: 'Corruptor' },
    { code: 'DASO', description: 'Domestic Abuse Safety Officer' },
    { code: 'DORIS', description: 'DoRIS (Disruption of Recorded Internal Secretors)' },
    { code: 'ICC', description: 'Information on Closed Case' },
    { code: 'IIOM', description: 'Integrated Offender Management' },
    { code: 'JIP', description: 'Joint Intelligence Programme' },
    { code: 'REG26', description: 'Organised Crime' },
    { code: 'RSTO', description: 'Restraining Order' },
    { code: 'RTPS', description: 'Risk to Probation Staff' },
    { code: 'SHPO', description: 'Sexual Harm Prevention Order / Sexual Risk Order' },
    { code: 'ASFO', description: 'SFO' },
    { code: 'ALSH', description: 'Suicide/Self Harm' },
    { code: 'INVI', description: 'Victim Contact' },
    { code: 'WRSM', description: 'Warrant / Summons' },
    { code: 'WEAP', description: 'Weapons' },
  ],
  safeguardingNeed: [
    { code: 'CL2', description: 'County Lines - Victim' },
    { code: 'CUCK', description: 'Cuckooing - Potential Victim' },
    { code: 'ADVV', description: 'Domestic Abuse Victim' },
    { code: 'MSV', description: 'Modern Slavery - Victim' },
    { code: 'RVAD', description: 'Safeguarding - "Adult At Risk"' },
  ],

  cohort: [
    { code: 'PRC', description: 'Contact Suspended' },
    { code: 'CYB2', description: 'Cyber - Dependent' },
    { code: 'CYB1', description: 'Cyber - Enabled' },
    { code: 'GA', description: 'Grand Avenues Cohort' },
    { code: 'HOIE', description: 'Home Office Interest' },
    { code: 'INLL', description: 'Lifer' },
    { code: 'COC', description: 'Organised Crime - Overt' },
    { code: 'SSS', description: 'Short Sentence Service' },
    { code: 'STRG', description: 'Street Gangs' },
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

const MAX_RISK_BADGES = 7

function getRiskRegisterType(description: string): string | undefined {
  const normalisedDescription = description.trim().toLowerCase()

  return registerTypePriority.find(registerType =>
    registerTypes[registerType].some(register => register.description.trim().toLowerCase() === normalisedDescription),
  )
}

function getRiskBadgeClass(description: string, severity: string): string {
  const normalisedDescription = description.trim().toLowerCase()

  if (cohortDescriptions.has(normalisedDescription)) {
    return riskTypeBadgeClass.cohort
  }

  if (miscDescriptions.has(normalisedDescription)) {
    return riskTypeBadgeClass.misc
  }

  return riskLevelBadgeClass[severity] ?? riskLevelBadgeClass.LOW
}

function getRiskLevel(flag: RiskFlag): string | undefined {
  const normalisedDescription = flag.description.trim().toLowerCase()

  // Cohort badges do not have a risk severity
  if (cohortDescriptions.has(normalisedDescription)) {
    return 'LOW'
  }

  if (risksWithLevelDescription.has(normalisedDescription)) {
    return (flag.levelDescription ?? flag.level)?.toUpperCase()
  }

  return riskLevelByDescription[normalisedDescription] ?? flag.level?.toUpperCase()
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
    const displayDescription = description.replace(/^Mappa\b/, 'MAPPA').replace(/^Cppc\b/, 'CPPC')

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
      badgeClass: getRiskBadgeClass(flag.description, severity),
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

  console.log('************** riskFlags *****************')
  console.dir(riskFlags, { depth: null })
  console.log('*******************************')

  const activeRiskFlags = riskFlags.filter(
    flag =>
      !flag.removed &&
      validRiskDescriptions.has(flag.description.trim().toLowerCase()) &&
      getRiskLevel(flag) !== undefined,
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

    return aRegisterPriority - bRegisterPriority
  })

  const visibleRiskFlags = sortedRiskFlags.slice(0, MAX_RISK_BADGES)

  const groups = getGroupedRiskBadges(visibleRiskFlags)

  return {
    groups,
    remainingCount: Math.max(sortedRiskFlags.length - MAX_RISK_BADGES, 0),
  }
}
