import { RiskFlag } from '../data/model/risk'
import { toSentenceCase } from './toSentenceCase'

const riskLevelBadgeClass: Record<string, string> = {
  'VERY HIGH': 'risk-badge--very-high',
  HIGH: 'risk-badge--high',
  MEDIUM: 'risk-badge--medium',
  LOW: 'risk-badge--low',
}

const riskTypeBadgeClass: Record<string, string> = {
  COHORT: 'risk-badge--cohort',
  MISCELLANEOUS: 'risk-badge--misc',
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
  'home office interest',
  'lifer',
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

// Higher priorities sort first. Unknown values default to 0, so sort last.
const riskLevelPriority: Record<string, number> = {
  'VERY HIGH': 40,
  HIGH: 30,
  MEDIUM: 20,
  LOW: 10,
}

const riskGroupPriority: Record<string, number> = {
  'Very high': 60,
  High: 50,
  Medium: 40,
  Low: 30,
  Cohort: 20,
  Miscellaneous: 10,
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

type RegisterType = keyof typeof registerTypes

const registerTypePriority: Record<RegisterType, number> = {
  publicProtection: 50,
  safeguardingRisk: 40,
  alerts: 30,
  safeguardingNeed: 20,
  cohort: 10,
}

interface RiskBadge {
  id: number
  text: string
  level: string
  badgeClass: string
}

type RiskBadgeType = keyof typeof riskLevelBadgeClass | keyof typeof riskTypeBadgeClass

interface RiskBadgeGroup {
  severity: string
  title: string
  className: string
  badges: RiskBadge[]
}

export interface RiskBadgeData {
  groupedBadges: RiskBadgeGroup[]
  headerBadges: RiskBadge[]
  remainingCount: number
}

const MAX_RISK_BADGES = 7

function getRiskRegisterType(description: string): RegisterType | undefined {
  const normalisedDescription = description.trim().toLowerCase()

  return (Object.keys(registerTypes) as RegisterType[]).find(registerType =>
    registerTypes[registerType].some(register => register.description.trim().toLowerCase() === normalisedDescription),
  )
}

function getRiskFlagGroup(description: string, severity: string): RiskBadgeGroup {
  const normalisedDescription = description.trim().toLowerCase()

  let type: RiskBadgeType = severity ?? 'LOW'

  if (cohortDescriptions.has(normalisedDescription)) {
    type = 'COHORT'
  }

  if (miscDescriptions.has(normalisedDescription)) {
    type = 'MISCELLANEOUS'
  }

  const title = `${type.charAt(0).toUpperCase()}${type.substring(1).toLowerCase()}`

  return {
    severity: type,
    title,
    className: riskLevelBadgeClass[type] ?? riskTypeBadgeClass[type],
    badges: [],
  }
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

function getRiskSortingPriority(description: string): number {
  const normalisedDescription = description.trim().toLowerCase()

  if (normalisedDescription === 'risk to probation staff') {
    return 2
  }

  if (normalisedDescription === 'risk to staff') {
    return 1
  }

  return 0
}

function getRiskDisplayDescription(flag: RiskFlag): string {
  const severity = getRiskLevel(flag)
  const normalisedDescription = flag.description.trim().toLowerCase()
  const displayDescription = toSentenceCase(flag.description, [], null, true, false)

  const displayOverrides: Record<string, string> = {
    'child criminal exploitation (cce) perpetrator': 'Child Criminal Exploitation (CCE) perpetrator',
    marac: 'MARAC',
    'suicide/self harm': 'Suicide/Self Harm',
    'cppc registered case': 'CPPC registered case',
    mappa: 'MAPPA',
    'doris (disruption of recorded internal secretors)': 'DORIS (disruption of recorded internal secretors)',
  }

  let text = displayOverrides[normalisedDescription] ?? displayDescription

  if (normalisedDescription === 'lifer') {
    const levelDescription = flag.levelDescription?.replace(/^Lifer\s*-\s*/i, '').toLowerCase()
    text = levelDescription ? `Lifer - ${levelDescription}` : text
  } else if (lowRiskLevelWithDescription.has(normalisedDescription)) {
    const levelDescription = flag.levelDescription?.replace('MAPPA ', '') ?? ''
    text = `${text} - ${levelDescription}`
  } else if (risksWithLevelDescription.has(normalisedDescription)) {
    text = `${text} - ${toSentenceCase(severity, [], null, true, false)}`
  }

  return text
}

function renderRiskBadge(flag: RiskFlag): RiskBadge {
  const severity = getRiskLevel(flag)
  const group = getRiskFlagGroup(flag.description, severity)

  return {
    id: flag.id,
    text: getRiskDisplayDescription(flag),
    level: severity,
    badgeClass: group.className,
  }
}

function getGroupedRiskBadges(riskFlags: RiskFlag[]) {
  const groups = riskFlags.reduce<RiskBadgeGroup[]>((result, flag) => {
    const severity = getRiskLevel(flag)
    const badgeGroup = getRiskFlagGroup(flag.description, severity)

    let group = result.find(g => g.title === badgeGroup.title)

    if (!group) {
      group = badgeGroup
      result.push(group)
    }

    group.badges.push(renderRiskBadge(flag))

    return result
  }, [])

  return groups.sort((a, b) => (riskGroupPriority[b.title] ?? 0) - (riskGroupPriority[a.title] ?? 0))
}

const validRiskDescriptions = new Set(
  Object.values(registerTypes)
    .flat()
    .map(registerType => registerType.description.toLowerCase()),
)

export function getRiskBadges(riskFlags: RiskFlag[]): RiskBadgeData {
  const activeRiskFlags = riskFlags.filter(
    flag =>
      !flag.removed &&
      validRiskDescriptions.has(flag.description.trim().toLowerCase()) &&
      getRiskLevel(flag) !== undefined,
  )

  const sortedRiskFlags = [...activeRiskFlags].sort((a, b) => {
    const aDescription = a.description.trim().toLowerCase()
    const bDescription = b.description.trim().toLowerCase()

    // 1. Risk to Probation Staff, then Risk to Staff.
    const aRiskPriority = getRiskSortingPriority(aDescription)
    const bRiskPriority = getRiskSortingPriority(bDescription)

    if (aRiskPriority !== bRiskPriority) {
      return bRiskPriority - aRiskPriority
    }

    const aRegisterType = getRiskRegisterType(a.description)
    const bRegisterType = getRiskRegisterType(b.description)

    // 2. Public Protection risks come before the other register types.
    const aIsPublicProtection = aRegisterType === 'publicProtection'
    const bIsPublicProtection = bRegisterType === 'publicProtection'

    if (aIsPublicProtection !== bIsPublicProtection) {
      return aIsPublicProtection ? -1 : 1
    }

    // 3. Within Public Protection, sort by severity when both risks
    // have a recognised severity. Otherwise, sort alphabetically.
    if (aIsPublicProtection && bIsPublicProtection) {
      const severityComparison = (riskLevelPriority[getRiskLevel(b)] ?? 0) - (riskLevelPriority[getRiskLevel(a)] ?? 0)

      if (severityComparison !== 0) {
        return severityComparison
      }

      return aDescription.localeCompare(bDescription)
    }

    // 4. Remaining register types:
    // Safeguarding Risk → Alerts → Safeguarding Need → Cohort.
    const registerComparison = (registerTypePriority[bRegisterType] ?? 0) - (registerTypePriority[aRegisterType] ?? 0)

    if (registerComparison !== 0) {
      return registerComparison
    }

    // 5. Alphabetical order within each remaining register type.
    return aDescription.localeCompare(bDescription)
  })

  return {
    groupedBadges: getGroupedRiskBadges(sortedRiskFlags),
    headerBadges: sortedRiskFlags.slice(0, MAX_RISK_BADGES).map(renderRiskBadge),
    remainingCount: Math.max(sortedRiskFlags.length - MAX_RISK_BADGES, 0),
  }
}
