import { PersonActivity } from '../data/model/activityLog'
import { PersonAppointment, Schedule, Activity } from '../data/model/schedule'

type ApprovedContactMetadata = {
  displayName: string
  code: string
}

const approvedContactMetadataByLegacyName: Record<string, ApprovedContactMetadata> = {
  'Accommodation Evidence': { displayName: 'Accommodation evidence', code: 'ACOM1' },
  'Alcohol Consumption': { displayName: 'Alcohol consumption', code: 'AAM1' },
  'Arrest Incident': { displayName: 'Arrest incident', code: 'CARR' },
  'Assistance at Court - Court Query': { displayName: 'Assistance at court - court query', code: 'CRTUP4' },
  'Assistance to Court – Update from PP': {
    displayName: 'Assistance to court – update from probation practitioner',
    code: 'CRTUP',
  },
  'Case Conference': { displayName: 'Case conference', code: 'CCON' },
  'Case Consultation': { displayName: 'Case consultation', code: 'RRPCC1' },
  'Case Decisions': { displayName: 'Case decisions', code: 'C053' },
  'Case Discussion': { displayName: 'Case discussions', code: 'C238' },
  'Case Reviewed by Case Manager': { displayName: 'Case reviewed by case manager', code: 'CRCO' },
  'CMS - Assistance with Assessments': { displayName: 'CMS - assistance with assessments', code: 'CMS40' },
  'CMS - Assistance with Case Conferencing': { displayName: 'CMS - assistance with case conferencing', code: 'CMS41' },
  'CMS - Attending Partnership Meetings': { displayName: 'CMS - attending partnership meetings', code: 'CMS42' },
  'CMS - Case Related Communication': { displayName: 'CMS - case related communication', code: 'CMS43' },
  'CMS - Completing & Assisting with Referrals': {
    displayName: 'CMS - completing and assisting with referrals',
    code: 'CMS44',
  },
  'CMS - Court Liaison & Applications to Court': {
    displayName: 'CMS - court liaison and applications to court',
    code: 'CMS45',
  },
  'CMS - Home & Prison Visits': { displayName: 'CMS - home and prison visits', code: 'CMS47' },
  'CMS - Information & Intelligence Gathering': {
    displayName: 'CMS - information and intelligence gathering',
    code: 'CMS48',
  },
  'CMS - ROTL Assessments & Support': { displayName: 'CMS - ROTL assessments and support', code: 'CMS49' },
  'CMS - Sentence Plan Intervention Delivery': {
    displayName: 'CMS - sentence plan intervention delivery',
    code: 'CMS50',
  },
  'Consultation with Manager': { displayName: 'Consultation with manager', code: 'CSPO' },
  'Contact with Electronic Monitoring Provider': {
    displayName: 'Contact with electronic monitoring provider',
    code: 'C063',
  },
  'Core Group meeting': { displayName: 'Core group meeting', code: 'NSD1' },
  'CPS Received': { displayName: 'CPS received', code: 'C016' },
  'Critical Communications': { displayName: 'Critical communications', code: 'AAM10' },
  'Death Under Supervision Category and Notification': {
    displayName: 'Death under supervision category and notification',
    code: 'DUS01',
  },
  'Disclosure Considered': { displayName: 'Disclosure considered', code: 'DAD1' },
  'Disclosure Response  / Completion': { displayName: 'Disclosure response or completion', code: 'DAD2' },
  'eMail/Text from Other': { displayName: 'Email or text from other', code: 'CM3A' },
  'eMail/Text from PoP': { displayName: 'Email or text from person on probation', code: 'CMOA' },
  'eMail/Text to Other': { displayName: 'Email or text to other', code: 'CM3B' },
  'eMail/Text to PoP': { displayName: 'Email or text to person on probation', code: 'CMOB' },
  'Gang Member Information Sharing': { displayName: 'Gang member information sharing', code: 'C344' },
  'HDC - Correspondence / Communication': { displayName: 'HDC - correspondence or communication', code: 'CDHC' },
  'Health and Social Service Liaison': { displayName: 'Health and social service liaison', code: 'C203' },
  'Health and Well Being Referral': { displayName: 'Health and well being referral', code: 'C115' },
  'Information - from 3rd Party': { displayName: 'Information from third party', code: 'CI3A' },
  'Information - from EMS Provider': { displayName: 'Information from EMS provider', code: 'INFFES' },
  'Information - from External Agency': { displayName: 'Information from external agency', code: 'CIEA' },
  'Information - from PoP': { displayName: 'Information from person on probation', code: 'CIOA' },
  'Information - Other': { displayName: 'Information - other', code: 'CIZZ' },
  'Information - to 3rd Party': { displayName: 'Information to third party', code: 'CI3B' },
  'Information - to EMS Provider': { displayName: 'Information to EMS provider', code: 'INFTES' },
  'Information - to External Agency': { displayName: 'Information to external agency', code: 'CIEB' },
  'Information - to PoP': { displayName: 'Information to person on probation', code: 'CIOB' },
  'Information / Documents Requested': { displayName: 'Information or documents requested', code: 'C325' },
  'Information from Court Team': { displayName: 'Information from court team', code: 'C294' },
  'Internal Communications': { displayName: 'Internal communications', code: 'C326' },
  'Interpreter Requested/ Confirmed': { displayName: 'Interpreter requested or confirmed', code: 'C333' },
  'IOM Case Conference': { displayName: 'IOM case conference', code: 'ICON' },
  'IOM Correspondence/Mail Contact': { displayName: 'IOM correspondence contact', code: 'CAIL' },
  'IOM Referral': { displayName: 'IOM referral', code: 'ERFI' },
  'IOM Review': { displayName: 'IOM review', code: 'CAIR' },
  'IPP Progression Panel': { displayName: 'IPP progression panel', code: 'IRP2' },
  'Letter/Fax from Other': { displayName: 'Letter or fax from other', code: 'CL3A' },
  'Letter/Fax from PoP': { displayName: 'Letter or fax from person on probation', code: 'CLOA' },
  'Letter/Fax to Other': { displayName: 'Letter or fax to other', code: 'CL3B' },
  'Letter/Fax to PoP': { displayName: 'Letter or fax to person on probation', code: 'CLOB' },
  'Liaison with Drug Treatment Provider': { displayName: 'Liaison with drug treatment provider', code: 'CLDR' },
  'Licence Compliance Letter': { displayName: 'Licence compliance letter', code: 'LCL' },
  'Lifer Review Panel': { displayName: 'Lifer review panel', code: 'LRP1' },
  'Management Oversight': { displayName: 'Management oversight', code: 'MO1' },
  'Management Oversight – HVRA': { displayName: 'Management oversight – home visit risk assessment', code: 'MO8' },
  'MAPPA Information': { displayName: 'MAPPA information', code: 'C200' },
  'MAPPA J Form - Job Centre+ Notification': { displayName: 'MAPPA J Form - Job Centre+ notification', code: 'C484' },
  'MAPPA Level 1 Review': { displayName: 'MAPPA level 1 review', code: 'C281' },
  'MAPPA Level setting process': { displayName: 'MAPPA level setting process', code: 'MAPLS' },
  'MAPPA Meeting': { displayName: 'MAPPA meeting', code: 'CCMM' },
  'MAPPA Referral': { displayName: 'MAPPA referral', code: 'CCMR' },
  'MARAC - Perpetrated DV Incident': { displayName: 'MARAC - perpetrated DV incident', code: 'C150' },
  'MARAC - Victim of DV Incident': { displayName: 'MARAC - victim of DV incident', code: 'C151' },
  'Marac Meeting': { displayName: 'MARAC meeting', code: 'C005' },
  'MARAC Referral': { displayName: 'MARAC referral', code: 'ERFM' },
  'Order/ Licence Received': { displayName: 'Order or licence received', code: 'C256' },
  'Other Enforcement Action': { displayName: 'Other enforcement action', code: 'BRED' },
  'Parole Hearing - Notification of Outcome': { displayName: 'Parole hearing - notification of outcome', code: 'C395' },
  'Phone Contact from Other': { displayName: 'Telephone contact from other', code: 'CT3A' },
  'Phone Contact from PoP': { displayName: 'Telephone contact from person on probation', code: 'CTOA' },
  'Phone Contact to Other': { displayName: 'Telephone contact to other', code: 'CT3B' },
  'Phone Contact to PoP': { displayName: 'Telephone contact to person on probation', code: 'CTOB' },
  'Police Intelligence Enquiries - Requested': {
    displayName: 'Police intelligence enquiries - requested',
    code: 'C369',
  },
  'Police Intelligence Enquiries -Response Received': {
    displayName: 'Police intelligence enquiries - response received',
    code: 'C515',
  },
  'Police Liaison': { displayName: 'Police liaison', code: 'C204' },
  'POM/COM Standard Handover - Information Received': {
    displayName: 'POM/COM standard handover - information received',
    code: 'POM4',
  },
  'Pre Cons Received': { displayName: 'Pre-cons received', code: 'DPRE' },
  'Pre-Cons Requested': { displayName: 'Pre-cons requested', code: 'C187' },
  'Prevent Activity': { displayName: 'Prevent activity', code: 'PREVENT' },
  'Prison Liaison': { displayName: 'Prison liaison', code: 'C202' },
  'Professional Judgement': { displayName: 'Professional judgement', code: 'CTPJ' },
  'PS Recall Decision': { displayName: 'PS recall decision', code: 'CNPS' },
  'QA - HDC2 and 3/PD1 Received': { displayName: 'QA - HDC2 and 3/PD1 received', code: 'C399' },
  'QA - HDC3/PD1 Returned to Prison': { displayName: 'QA - HDC3/PD1 returned to prison', code: 'C401' },
  'Referral - Children and Families of Person on Prob': {
    displayName: 'Referral - children and families of person on probation',
    code: 'C507',
  },
  'Referral - Finance/ Benefits/ Debt': { displayName: 'Referral - finance, benefits or debt', code: 'C347' },
  'Request For Information': { displayName: 'Request for information', code: 'CRFI' },
  'Risk Notification to EMS Provider': { displayName: 'Risk notification to EMS provider', code: 'RTEMS' },
  'ROTL - Release': { displayName: 'ROTL - release', code: 'ROTL' },
  'ROTL - Return': { displayName: 'ROTL - return', code: 'ROTR' },
  'Safeguarding - Child Protection Core Group Meeting': {
    displayName: 'Safeguarding - child protection core group meeting',
    code: 'C159',
  },
  'Safeguarding - Child Protection Meeting': { displayName: 'Safeguarding - child protection meeting', code: 'C078' },
  'Safeguarding - Child Related Contact': { displayName: 'Safeguarding - child related contact', code: 'C157' },
  'Safeguarding - Vulnerable Adult Contact': { displayName: 'Safeguarding - vulnerable adult contact', code: 'C161' },
  'Safeguarding - Vulnerable Adult Strategy Meeting': {
    displayName: 'Safeguarding - vulnerable adult strategy meeting',
    code: 'C160',
  },
  'Safeguarding Assessment': { displayName: 'Safeguarding assessment', code: 'EASS' },
  'Safeguarding Case Conference': { displayName: 'Safeguarding case conference', code: 'CCCP' },
  'Safeguarding Enquiries - Response Received': {
    displayName: 'Safeguarding enquiries - response received',
    code: 'SFRR',
  },
  'Safeguarding Enquiries Requested': { displayName: 'Safeguarding enquiries requested', code: 'SFGC' },
  'Sensitive Information Contact': { displayName: 'Sensitive information contact', code: 'CNDC' },
  'Sick Note Received': { displayName: 'Sick note received', code: 'CSNR' },
  'Substance Use Screening Tool': { displayName: 'Substance misuse screening tool', code: 'DRAT' },
  'Suicide/Self Harm Information': { displayName: 'Suicide or self harm information', code: 'C280' },
  'Text Message to Send': { displayName: 'Text message to send', code: 'CTXT' },
  'Unplanned Contact from Person on Probation': {
    displayName: 'Unplanned contact from person on probation',
    code: 'COUP',
  },
  'Use of Video Link / Teleconference': { displayName: 'Use of video link or teleconference', code: 'C129' },
  'Victim Liaison Contact': { displayName: 'Victim liaison contact', code: 'CVIC' },
  'ViSOR Information Contact': { displayName: 'ViSOR information contact', code: 'VINC' },
}

const isWhitespace = (character: string): boolean =>
  character === ' ' ||
  character === '\n' ||
  character === '\r' ||
  character === '\t' ||
  character === '\f' ||
  character === '\v'

export function normalizeContactDisplayNameKey(value: string): string {
  const normalized = value.trim().replace(/[–—]/g, '-')
  let result = ''
  let previousWasWhitespace = false

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index]

    if (isWhitespace(character)) {
      previousWasWhitespace = true
    } else if (character === '/') {
      if (result && !result.endsWith(' ')) {
        result += ' '
      }
      result += '/ '
      previousWasWhitespace = false
    } else {
      if (previousWasWhitespace && result && !result.endsWith(' ')) {
        result += ' '
      }

      result += character
      previousWasWhitespace = false
    }
  }

  return result.trimEnd().toLowerCase()
}

const normalizedApprovedContactMetadata = Object.fromEntries(
  Object.entries(approvedContactMetadataByLegacyName).flatMap(([legacyName, metadata]) => [
    [normalizeContactDisplayNameKey(legacyName), metadata],
    [normalizeContactDisplayNameKey(metadata.displayName), metadata],
  ]),
) as Record<string, ApprovedContactMetadata>

export function getApprovedContactDisplayName(value?: string): string | undefined {
  if (!value) {
    return undefined
  }

  return normalizedApprovedContactMetadata[normalizeContactDisplayNameKey(value)]?.displayName
}

export function getApprovedContactCode(value?: string): string | undefined {
  if (!value) {
    return undefined
  }

  return normalizedApprovedContactMetadata[normalizeContactDisplayNameKey(value)]?.code
}

export function withApprovedContactDisplayName<T extends Activity>(activity: T): T {
  if (!activity?.type) {
    return activity
  }

  const displayName = getApprovedContactDisplayName(activity.action) ?? getApprovedContactDisplayName(activity.type)

  if (!displayName) {
    return activity
  }

  return { ...activity, displayName }
}

export function mapScheduleWithApprovedContactDisplayNames(schedule: Schedule): Schedule {
  if (!schedule?.personSchedule?.appointments) {
    return schedule
  }

  return {
    ...schedule,
    personSchedule: {
      ...schedule.personSchedule,
      appointments: schedule.personSchedule.appointments.map(withApprovedContactDisplayName),
    },
  }
}

export function mapPersonActivityWithApprovedContactDisplayNames(personActivity: PersonActivity): PersonActivity {
  if (!personActivity?.activities) {
    return personActivity
  }

  return {
    ...personActivity,
    activities: personActivity.activities.map(withApprovedContactDisplayName),
  }
}

export function mapPersonAppointmentWithApprovedContactDisplayNames(
  personAppointment: PersonAppointment,
): PersonAppointment {
  if (!personAppointment?.appointment) {
    return personAppointment
  }

  return {
    ...personAppointment,
    appointment: withApprovedContactDisplayName(personAppointment.appointment),
  }
}
