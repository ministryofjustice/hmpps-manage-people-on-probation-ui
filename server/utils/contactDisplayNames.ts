import { PersonActivity } from '../data/model/activityLog'
import { PersonAppointment, Schedule, Activity, EnforcementContactsResponse } from '../data/model/schedule'

const approvedContactDisplayNames: Record<string, string> = {
  'Accommodation Evidence': 'Accommodation evidence',
  'Alcohol Consumption': 'Alcohol consumption',
  'Arrest Incident': 'Arrest incident',
  'Assistance at Court - Court Query': 'Assistance at court - court query',
  'Assistance to Court – Update from PP': 'Assistance to court – update from probation practitioner',
  'Case Conference': 'Case conference',
  'Case Consultation': 'Case consultation',
  'Case Decisions': 'Case decisions',
  'Case Discussion': 'Case discussions',
  'Case Reviewed by Case Manager': 'Case reviewed by case manager',
  'CMS - Assistance with Assessments': 'CMS - assistance with assessments',
  'CMS - Assistance with Case Conferencing': 'CMS - assistance with case conferencing',
  'CMS - Attending Partnership Meetings': 'CMS - attending partnership meetings',
  'CMS - Case Related Communication': 'CMS - case related communication',
  'CMS - Completing & Assisting with Referrals': 'CMS - completing and assisting with referrals',
  'CMS - Court Liaison & Applications to Court': 'CMS - court liaison and applications to court',
  'CMS - Home & Prison Visits': 'CMS - home and prison visits',
  'CMS - Information & Intelligence Gathering': 'CMS - information and intelligence gathering',
  'CMS - ROTL Assessments & Support': 'CMS - ROTL assessments and support',
  'CMS - Sentence Plan Intervention Delivery': 'CMS - sentence plan intervention delivery',
  'Consultation with Manager': 'Consultation with manager',
  'Contact with Electronic Monitoring Provider': 'Contact with electronic monitoring provider',
  'Core Group meeting': 'Core group meeting',
  'CPS Received': 'CPS received',
  'Critical Communications': 'Critical communications',
  'Death Under Supervision Category and Notification': 'Death under supervision category and notification',
  'Disclosure Considered': 'Disclosure considered',
  'Disclosure Response  / Completion': 'Disclosure response or completion',
  'eMail/Text from Other': 'Email or text from other',
  'eMail/Text from PoP': 'Email or text from person on probation',
  'eMail/Text to Other': 'Email or text to other',
  'eMail/Text to PoP': 'Email or text to person on probation',
  'Gang Member Information Sharing': 'Gang member information sharing',
  'HDC - Correspondence / Communication': 'HDC - correspondence or communication',
  'Health and Social Service Liaison': 'Health and social service liaison',
  'Health and Well Being Referral': 'Health and well being referral',
  'Information - from 3rd Party': 'Information from third party',
  'Information - from EMS Provider': 'Information from EMS provider',
  'Information - from External Agency': 'Information from external agency',
  'Information - from PoP': 'Information from person on probation',
  'Information - Other': 'Information - other',
  'Information - to 3rd Party': 'Information to third party',
  'Information - to EMS Provider': 'Information to EMS provider',
  'Information - to External Agency': 'Information to external agency',
  'Information - to PoP': 'Information to person on probation',
  'Information / Documents Requested': 'Information or documents requested',
  'Information from Court Team': 'Information from court team',
  'Internal Communications': 'Internal communications',
  'Interpreter Requested/ Confirmed': 'Interpreter requested or confirmed',
  'IOM Case Conference': 'IOM case conference',
  'IOM Correspondence/Mail Contact': 'IOM correspondence contact',
  'IOM Referral': 'IOM referral',
  'IOM Review': 'IOM review',
  'IPP Progression Panel': 'IPP progression panel',
  'Letter/Fax from Other': 'Letter or fax from other',
  'Letter/Fax from PoP': 'Letter or fax from person on probation',
  'Letter/Fax to Other': 'Letter or fax to other',
  'Letter/Fax to PoP': 'Letter or fax to person on probation',
  'Liaison with Drug Treatment Provider': 'Liaison with drug treatment provider',
  'Licence Compliance Letter': 'Licence compliance letter',
  'Lifer Review Panel': 'Lifer review panel',
  'Management Oversight': 'Management oversight',
  'Management Oversight – HVRA': 'Management oversight – home visit risk assessment',
  'MAPPA Information': 'MAPPA information',
  'MAPPA J Form - Job Centre+ Notification': 'MAPPA J Form - Job Centre+ notification',
  'MAPPA Level 1 Review': 'MAPPA level 1 review',
  'MAPPA Level setting process': 'MAPPA level setting process',
  'MAPPA Meeting': 'MAPPA meeting',
  'MAPPA Referral': 'MAPPA referral',
  'MARAC - Perpetrated DV Incident': 'MARAC - perpetrated DV incident',
  'MARAC - Victim of DV Incident': 'MARAC - victim of DV incident',
  'Marac Meeting': 'MARAC meeting',
  'MARAC Referral': 'MARAC referral',
  'Order/ Licence Received': 'Order or licence received',
  'Other Enforcement Action': 'Other enforcement action',
  'Parole Hearing - Notification of Outcome': 'Parole hearing - notification of outcome',
  'Phone Contact from Other': 'Telephone contact from other',
  'Phone Contact from PoP': 'Telephone contact from person on probation',
  'Phone Contact to Other': 'Telephone contact to other',
  'Phone Contact to PoP': 'Telephone contact to person on probation',
  'Police Intelligence Enquiries - Requested': 'Police intelligence enquiries - requested',
  'Police Intelligence Enquiries -Response Received': 'Police intelligence enquiries - response received',
  'Police Liaison': 'Police liaison',
  'POM/COM Standard Handover - Information Received': 'POM/COM standard handover - information received',
  'Pre Cons Received': 'Pre-cons received',
  'Pre-Cons Requested': 'Pre-cons requested',
  'Prevent Activity': 'Prevent activity',
  'Prison Liaison': 'Prison liaison',
  'Professional Judgement': 'Professional judgement',
  'PS Recall Decision': 'PS recall decision',
  'QA - HDC2 and 3/PD1 Received': 'QA - HDC2 and 3/PD1 received',
  'QA - HDC3/PD1 Returned to Prison': 'QA - HDC3/PD1 returned to prison',
  'Referral - Children and Families of Person on Prob': 'Referral - children and families of person on probation',
  'Referral - Finance/ Benefits/ Debt': 'Referral - finance, benefits or debt',
  'Request For Information': 'Request for information',
  'Risk Notification to EMS Provider': 'Risk notification to EMS provider',
  'ROTL - Release': 'ROTL - release',
  'ROTL - Return': 'ROTL - return',
  'Safeguarding - Child Protection Core Group Meeting': 'Safeguarding - child protection core group meeting',
  'Safeguarding - Child Protection Meeting': 'Safeguarding - child protection meeting',
  'Safeguarding - Child Related Contact': 'Safeguarding - child related contact',
  'Safeguarding - Vulnerable Adult Contact': 'Safeguarding - vulnerable adult contact',
  'Safeguarding - Vulnerable Adult Strategy Meeting': 'Safeguarding - vulnerable adult strategy meeting',
  'Safeguarding Assessment': 'Safeguarding assessment',
  'Safeguarding Case Conference': 'Safeguarding case conference',
  'Safeguarding Enquiries - Response Received': 'Safeguarding enquiries - response received',
  'Safeguarding Enquiries Requested': 'Safeguarding enquiries requested',
  'Sensitive Information Contact': 'Sensitive information contact',
  'Sick Note Received': 'Sick note received',
  'Substance Use Screening Tool': 'Substance misuse screening tool',
  'Suicide/Self Harm Information': 'Suicide or self harm information',
  'Text Message to Send': 'Text message to send',
  'Unplanned Contact from Person on Probation': 'Unplanned contact from person on probation',
  'Use of Video Link / Teleconference': 'Use of video link or teleconference',
  'Victim Liaison Contact': 'Victim liaison contact',
  'ViSOR Information Contact': 'ViSOR information contact',
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

const normalizedApprovedContactDisplayNames = Object.fromEntries(
  Object.entries(approvedContactDisplayNames).map(([legacyName, displayName]) => [
    normalizeContactDisplayNameKey(legacyName),
    displayName,
  ]),
)

export function getApprovedContactDisplayName(value?: string): string | undefined {
  if (!value) {
    return undefined
  }

  return normalizedApprovedContactDisplayNames[normalizeContactDisplayNameKey(value)]
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

export function mapEnforcementContactsWithApprovedContactDisplayNames(
  enforcementContacts: EnforcementContactsResponse,
): EnforcementContactsResponse {
  if (!enforcementContacts?.enforcementContacts) {
    return enforcementContacts
  }

  return {
    ...enforcementContacts,
    enforcementContacts: enforcementContacts.enforcementContacts.map(contact => {
      const displayName = getApprovedContactDisplayName(contact.appointmentType)
      return {
        ...contact,
        displayName: displayName || contact.appointmentType,
      }
    }),
  }
}
