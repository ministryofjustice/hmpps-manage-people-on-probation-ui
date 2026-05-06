import { PersonActivity } from '../data/model/activityLog'
import { PersonAppointment, Schedule, Activity } from '../data/model/schedule'

type ApprovedContactMetadata = {
  ndeliusName: string
  displayName: string
  code: string
}

const approvedContactMetadataEntries = [
  ['Accommodation Evidence', 'Accommodation evidence', 'ACOM1'],
  ['Alcohol Consumption', 'Alcohol consumption', 'AAM1'],
  ['Arrest Incident', 'Arrest incident', 'CARR'],
  ['Assistance at Court - Court Query', 'Assistance at court - court query', 'CRTUP4'],
  ['Assistance to Court – Update from PP', 'Assistance to court – update from probation practitioner', 'CRTUP'],
  ['Case Conference', 'Case conference', 'CCON'],
  ['Case Consultation', 'Case consultation', 'RRPCC1'],
  ['Case Decisions', 'Case decisions', 'C053'],
  ['Case Discussion', 'Case discussions', 'C238'],
  ['Case Reviewed by Case Manager', 'Case reviewed by case manager', 'CRCO'],
  ['CMS - Assistance with Assessments', 'CMS - assistance with assessments', 'CMS40'],
  ['CMS - Assistance with Case Conferencing', 'CMS - assistance with case conferencing', 'CMS41'],
  ['CMS - Attending Partnership Meetings', 'CMS - attending partnership meetings', 'CMS42'],
  ['CMS - Case Related Communication', 'CMS - case related communication', 'CMS43'],
  ['CMS - Completing & Assisting with Referrals', 'CMS - completing and assisting with referrals', 'CMS44'],
  ['CMS - Court Liaison & Applications to Court', 'CMS - court liaison and applications to court', 'CMS45'],
  ['CMS - Home & Prison Visits', 'CMS - home and prison visits', 'CMS47'],
  ['CMS - Information & Intelligence Gathering', 'CMS - information and intelligence gathering', 'CMS48'],
  ['CMS - ROTL Assessments & Support', 'CMS - ROTL assessments and support', 'CMS49'],
  ['CMS - Sentence Plan Intervention Delivery', 'CMS - sentence plan intervention delivery', 'CMS50'],
  ['Consultation with Manager', 'Consultation with manager', 'CSPO'],
  ['Contact with Electronic Monitoring Provider', 'Contact with electronic monitoring provider', 'C063'],
  ['Core Group meeting', 'Core group meeting', 'NSD1'],
  ['CPS Received', 'CPS received', 'C016'],
  ['Critical Communications', 'Critical communications', 'AAM10'],
  ['Death Under Supervision Category and Notification', 'Death under supervision category and notification', 'DUS01'],
  ['Disclosure Considered', 'Disclosure considered', 'DAD1'],
  ['Disclosure Response  / Completion', 'Disclosure response or completion', 'DAD2'],
  ['eMail/Text from Other', 'Email or text from other', 'CM3A'],
  ['eMail/Text from PoP', 'Email or text from person on probation', 'CMOA'],
  ['eMail/Text to Other', 'Email or text to other', 'CM3B'],
  ['eMail/Text to PoP', 'Email or text to person on probation', 'CMOB'],
  ['Gang Member Information Sharing', 'Gang member information sharing', 'C344'],
  ['HDC - Correspondence / Communication', 'HDC - correspondence or communication', 'CDHC'],
  ['Health and Social Service Liaison', 'Health and social service liaison', 'C203'],
  ['Health and Well Being Referral', 'Health and well being referral', 'C115'],
  ['Information - from 3rd Party', 'Information from third party', 'CI3A'],
  ['Information - from EMS Provider', 'Information from EMS provider', 'INFFES'],
  ['Information - from External Agency', 'Information from external agency', 'CIEA'],
  ['Information - from PoP', 'Information from person on probation', 'CIOA'],
  ['Information - Other', 'Information - other', 'CIZZ'],
  ['Information - to 3rd Party', 'Information to third party', 'CI3B'],
  ['Information - to EMS Provider', 'Information to EMS provider', 'INFTES'],
  ['Information - to External Agency', 'Information to external agency', 'CIEB'],
  ['Information - to PoP', 'Information to person on probation', 'CIOB'],
  ['Information / Documents Requested', 'Information or documents requested', 'C325'],
  ['Information from Court Team', 'Information from court team', 'C294'],
  ['Internal Communications', 'Internal communications', 'C326'],
  ['Interpreter Requested/ Confirmed', 'Interpreter requested or confirmed', 'C333'],
  ['IOM Case Conference', 'IOM case conference', 'ICON'],
  ['IOM Correspondence/Mail Contact', 'IOM correspondence contact', 'CAIL'],
  ['IOM Referral', 'IOM referral', 'ERFI'],
  ['IOM Review', 'IOM review', 'CAIR'],
  ['IPP Progression Panel', 'IPP progression panel', 'IRP2'],
  ['Letter/Fax from Other', 'Letter or fax from other', 'CL3A'],
  ['Letter/Fax from PoP', 'Letter or fax from person on probation', 'CLOA'],
  ['Letter/Fax to Other', 'Letter or fax to other', 'CL3B'],
  ['Letter/Fax to PoP', 'Letter or fax to person on probation', 'CLOB'],
  ['Liaison with Drug Treatment Provider', 'Liaison with drug treatment provider', 'CLDR'],
  ['Licence Compliance Letter', 'Licence compliance letter', 'LCL'],
  ['Lifer Review Panel', 'Lifer review panel', 'LRP1'],
  ['Management Oversight', 'Management oversight', 'MO1'],
  ['Management Oversight – HVRA', 'Management oversight – home visit risk assessment', 'MO8'],
  ['MAPPA Information', 'MAPPA information', 'C200'],
  ['MAPPA J Form - Job Centre+ Notification', 'MAPPA J Form - Job Centre+ notification', 'C484'],
  ['MAPPA Level 1 Review', 'MAPPA level 1 review', 'C281'],
  ['MAPPA Level setting process', 'MAPPA level setting process', 'MAPLS'],
  ['MAPPA Meeting', 'MAPPA meeting', 'CCMM'],
  ['MAPPA Referral', 'MAPPA referral', 'CCMR'],
  ['MARAC - Perpetrated DV Incident', 'MARAC - perpetrated DV incident', 'C150'],
  ['MARAC - Victim of DV Incident', 'MARAC - victim of DV incident', 'C151'],
  ['Marac Meeting', 'MARAC meeting', 'C005'],
  ['MARAC Referral', 'MARAC referral', 'ERFM'],
  ['Order/ Licence Received', 'Order or licence received', 'C256'],
  ['Other Enforcement Action', 'Other enforcement action', 'BRED'],
  ['Parole Hearing - Notification of Outcome', 'Parole hearing - notification of outcome', 'C395'],
  ['Phone Contact from Other', 'Telephone contact from other', 'CT3A'],
  ['Phone Contact from PoP', 'Telephone contact from person on probation', 'CTOA'],
  ['Phone Contact to Other', 'Telephone contact to other', 'CT3B'],
  ['Phone Contact to PoP', 'Telephone contact to person on probation', 'CTOB'],
  ['Police Intelligence Enquiries - Requested', 'Police intelligence enquiries - requested', 'C369'],
  ['Police Intelligence Enquiries -Response Received', 'Police intelligence enquiries - response received', 'C515'],
  ['Police Liaison', 'Police liaison', 'C204'],
  ['POM/COM Standard Handover - Information Received', 'POM/COM standard handover - information received', 'POM4'],
  ['Pre Cons Received', 'Pre-cons received', 'DPRE'],
  ['Pre-Cons Requested', 'Pre-cons requested', 'C187'],
  ['Prevent Activity', 'Prevent activity', 'PREVENT'],
  ['Prison Liaison', 'Prison liaison', 'C202'],
  ['Professional Judgement', 'Professional judgement', 'CTPJ'],
  ['PS Recall Decision', 'PS recall decision', 'CNPS'],
  ['QA - HDC2 and 3/PD1 Received', 'QA - HDC2 and 3/PD1 received', 'C399'],
  ['QA - HDC3/PD1 Returned to Prison', 'QA - HDC3/PD1 returned to prison', 'C401'],
  [
    'Referral - Children and Families of Person on Prob',
    'Referral - children and families of person on probation',
    'C507',
  ],
  ['Referral - Finance/ Benefits/ Debt', 'Referral - finance, benefits or debt', 'C347'],
  ['Request For Information', 'Request for information', 'CRFI'],
  ['Risk Notification to EMS Provider', 'Risk notification to EMS provider', 'RTEMS'],
  ['ROTL - Release', 'ROTL - release', 'ROTL'],
  ['ROTL - Return', 'ROTL - return', 'ROTR'],
  ['Safeguarding - Child Protection Core Group Meeting', 'Safeguarding - child protection core group meeting', 'C159'],
  ['Safeguarding - Child Protection Meeting', 'Safeguarding - child protection meeting', 'C078'],
  ['Safeguarding - Child Related Contact', 'Safeguarding - child related contact', 'C157'],
  ['Safeguarding - Vulnerable Adult Contact', 'Safeguarding - vulnerable adult contact', 'C161'],
  ['Safeguarding - Vulnerable Adult Strategy Meeting', 'Safeguarding - vulnerable adult strategy meeting', 'C160'],
  ['Safeguarding Assessment', 'Safeguarding assessment', 'EASS'],
  ['Safeguarding Case Conference', 'Safeguarding case conference', 'CCCP'],
  ['Safeguarding Enquiries - Response Received', 'Safeguarding enquiries - response received', 'SFRR'],
  ['Safeguarding Enquiries Requested', 'Safeguarding enquiries requested', 'SFGC'],
  ['Sensitive Information Contact', 'Sensitive information contact', 'CNDC'],
  ['Sick Note Received', 'Sick note received', 'CSNR'],
  ['Substance Use Screening Tool', 'Substance misuse screening tool', 'DRAT'],
  ['Suicide/Self Harm Information', 'Suicide or self harm information', 'C280'],
  ['Text Message to Send', 'Text message to send', 'CTXT'],
  ['Unplanned Contact from Person on Probation', 'Unplanned contact from person on probation', 'COUP'],
  ['Use of Video Link / Teleconference', 'Use of video link or teleconference', 'C129'],
  ['Victim Liaison Contact', 'Victim liaison contact', 'CVIC'],
  ['ViSOR Information Contact', 'ViSOR information contact', 'VINC'],
] as const satisfies readonly (readonly [ndeliusName: string, displayName: string, code: string])[]

const approvedContactMetadata = approvedContactMetadataEntries.map(
  ([ndeliusName, displayName, code]): ApprovedContactMetadata => ({
    ndeliusName,
    displayName,
    code,
  }),
)

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
  approvedContactMetadata.flatMap(metadata => [
    [normalizeContactDisplayNameKey(metadata.ndeliusName), metadata],
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
