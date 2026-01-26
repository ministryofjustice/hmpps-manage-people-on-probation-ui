import Fuse from 'fuse.js'

/**
 * REPRESENTATION OF A CONTACT TYPE
 */
export interface ContactType {
  code: string
  description: string
  synonyms?: string[] // Helps map phrases like "Call" to "Phone"
}

/**
 * THE LIST OF 88 CONTACTS (PROBATION CONTEXT)
 */
const CONTACT_TYPES: ContactType[] = [
  // --- tranche 1: Tranche of 88 ---
  { code: 'C001', description: 'Accommodation evidence', synonyms: ['housing', 'living arrangements', 'address'] },
  { code: 'C002', description: 'Phone Contact to PoP', synonyms: ['Call', 'Mobile', 'Cell', 'Telephone'] },
  { code: 'C003', description: 'E-mail communication', synonyms: ['Mail', 'Messaging', 'Electronic'] },
  { code: 'C004', description: 'Home Visit', synonyms: ['HV', 'Address visit', 'Domiciliary'] },
  { code: 'C005', description: 'Office Visit', synonyms: ['Reporting', 'Appointment', 'In person'] },
  { code: 'C006', description: 'Employment Evidence', synonyms: ['Job', 'Work', 'Payslip', 'P60'] },
  { code: 'C007', description: 'Health evidence', synonyms: ['Doctor', 'Medical', 'GP', 'Hospital'] },
  { code: 'C008', description: 'Police Liaison', synonyms: ['Cops', 'Constabulary', 'Arrest', 'Intelligence'] },
  { code: 'C009', description: 'Family Liaison', synonyms: ['Next of kin', 'Partner', 'Children'] },
  { code: 'C010', description: 'Drug Testing', synonyms: ['DIP', 'Swab', 'Urinalysis', 'Substance misuse'] },
  { code: 'C011', description: 'Alcohol Treatment', synonyms: ['Drinking', 'Rehab', 'AA'] },
  { code: 'C012', description: 'Mental Health Assessment', synonyms: ['Psychiatric', 'Therapy', 'Counselling'] },
  { code: 'C013', description: 'Unpaid Work Induction', synonyms: ['UPW', 'Community Payback', 'Work project'] },
  { code: 'C014', description: 'Court Report Prep', synonyms: ['Pre-sentence', 'PSR', 'Adjournment'] },
  { code: 'C015', description: 'License Conditions Review', synonyms: ['Parole', 'Release', 'Rules'] },
  { code: 'C016', description: 'Recall Initiated', synonyms: ['Prison return', 'Breach', 'Emergency'] },
  { code: 'C017', description: 'Victim Liaison', synonyms: ['VLO', 'Safety planning', 'Restorative'] },
  { code: 'C018', description: 'Social Services Check', synonyms: ['Safeguarding', 'Children services', 'MASH'] },
  { code: 'C019', description: 'Education Liaison', synonyms: ['College', 'School', 'University', 'Training'] },
  { code: 'C020', description: 'Benefits Evidence', synonyms: ['UC', 'Universal Credit', 'PIP', 'DWP'] },
  { code: 'C021', description: 'Initial Appointment', synonyms: ['First contact', 'Induction', 'Sign up'] },
  { code: 'C022', description: 'Planned Office Visit', synonyms: ['Regular reporting', 'Scheduled'] },
  { code: 'C023', description: 'Unplanned Office Visit', synonyms: ['Walk in', 'Drop in', 'Crisis'] },
  { code: 'C024', description: 'Video Call', synonyms: ['Teams', 'Skype', 'Zoom', 'WhatsApp video'] },
  { code: 'C025', description: 'SMS / Text Message', synonyms: ['Texting', 'Mobile message'] },
  { code: 'C026', description: 'Letter Sent', synonyms: ['Postal', 'Mail shot', 'Official notice'] },
  { code: 'C027', description: 'Letter Received', synonyms: ['Incoming mail', 'Post'] },
  { code: 'C028', description: 'MAPPA Meeting', synonyms: ['Multi-agency', 'High risk', 'Review'] },
  { code: 'C029', description: 'OMiC Liaison', synonyms: ['Prison staff', 'Key worker', 'Inmate'] },
  { code: 'C030', description: 'GP Appointment Evidence', synonyms: ['Health center', 'Doctor note'] },
  { code: 'C031', description: 'Financial Management', synonyms: ['Debt', 'Budgeting', 'Money advice'] },
  { code: 'C032', description: 'Derventio Housing Check', synonyms: ['Supported living', 'Provider'] },
  { code: 'C033', description: 'Electronic Monitoring Check', synonyms: ['Tag', 'Curfew', 'EMS'] },
  { code: 'C034', description: 'Enforcement Action', synonyms: ['Warning', 'Breach warning', 'Non-compliance'] },
  { code: 'C035', description: 'Programmes Session', synonyms: ['Group work', 'Thinking skills', 'TSP'] },
  { code: 'C036', description: 'Accredited Programme Review', synonyms: ['Evaluation', 'Progress check'] },
  { code: 'C037', description: 'Dependency Review', synonyms: ['Addiction', 'Recovery'] },
  { code: 'C038', description: 'Debt Advice Referral', synonyms: ['Bailiffs', 'Loan', 'Citizens Advice'] },
  { code: 'C039', description: 'Gambling Support', synonyms: ['Betting', 'Addiction help'] },
  { code: 'C040', description: 'Domestic Abuse Programme', synonyms: ['BWS', 'IDAP', 'Partner safety'] },
  { code: 'C041', description: 'Sexual Offending Treatment', synonyms: ['SOTP', 'Horizon'] },
  { code: 'C042', description: 'Emotional Wellbeing', synonyms: ['Stress', 'Anxiety', 'Mood'] },
  { code: 'C043', description: 'Identity and Lifestyle', synonyms: ['Peers', 'Gang liaison', 'Grip'] },
  { code: 'C044', description: 'Thinking and Behaviour', synonyms: ['Impulsivity', 'Attitudes'] },
  { code: 'C045', description: 'Attitudes to Offending', synonyms: ['Remorse', 'Responsibility'] },
  { code: 'C046', description: 'Review of Risk', synonyms: ['OASys', 'RSR', 'SARA'] },
  { code: 'C047', description: 'Termination Session', synonyms: ['Completion', 'End of order', 'Final'] },
  { code: 'C048', description: 'Transfer In Progress', synonyms: ['Moving area', 'New officer'] },
  { code: 'C049', description: 'Transfer Out Progress', synonyms: ['Handover', 'Relocation'] },
  { code: 'C050', description: 'Bereavement Support', synonyms: ['Grief', 'Death in family'] },
  { code: 'C051', description: 'Parenting Support', synonyms: ['Family work', 'FGC'] },
  { code: 'C052', description: 'Pre-Release Planning', synonyms: ['Resettlement', 'Through the gate'] },
  { code: 'C053', description: 'Sentence Plan Review', synonyms: ['Objectives', 'Targets'] },
  { code: 'C054', description: 'Tiering Review', synonyms: ['Case complexity', 'Workload'] },
  { code: 'C055', description: 'Serious Further Offence', synonyms: ['SFO', 'Incident'] },
  { code: 'C056', description: 'Legal Representation', synonyms: ['Solicitor', 'Lawyer', 'Barrister'] },
  { code: 'C057', description: 'Border Agency Liaison', synonyms: ['Home Office', 'Deportation', 'Immigration'] },
  { code: 'C058', description: 'Language / Interpreter Service', synonyms: ['Translation', 'ESOL'] },
  { code: 'C059', description: 'Disability Support', synonyms: ['Access', 'Reasonable adjustment'] },
  { code: 'C060', description: 'Veteran Support', synonyms: ['Military', 'Armed forces'] },
  { code: 'C061', description: 'Community Hub Visit', synonyms: ['CFO', 'Partner agency'] },
  { code: 'C062', description: 'Personality Disorder Pathway', synonyms: ['OPD', 'Specialist'] },
  { code: 'C063', description: 'Diversionary Activity', synonyms: ['Sport', 'Hobbies', 'Youth'] },
  { code: 'C064', description: 'Peer Mentor Session', synonyms: ['Lived experience'] },
  { code: 'C065', description: 'Faith / Religious Support', synonyms: ['Chaplain', 'Church', 'Mosque'] },
  { code: 'C066', description: 'Womens Centre Visit', synonyms: ['Female specific', 'Support group'] },
  { code: 'C067', description: 'Neurodiversity Support', synonyms: ['Autism', 'ADHD', 'Learning disability'] },
  { code: 'C068', description: 'Passport / ID Evidence', synonyms: ['Identity document', 'Birth certificate'] },
  { code: 'C069', description: 'Travel Warrant Issued', synonyms: ['Bus pass', 'Rail', 'Transport'] },
  { code: 'C070', description: 'Food Bank Referral', synonyms: ['Emergency food', 'Trussell trust'] },
  { code: 'C071', description: 'Charity Support', synonyms: ['Voluntary sector'] },
  { code: 'C072', description: 'Employer Liaison', synonyms: ['Manager', 'Workplace visit'] },
  { code: 'C073', description: 'Apprenticeship Evidence', synonyms: ['NVQ', 'Vocational'] },
  { code: 'C074', description: 'Volunteering Evidence', synonyms: ['Unpaid work', 'Charity work'] },
  { code: 'C075', description: 'CV Workshop', synonyms: ['Resume', 'Applications'] },
  { code: 'C076', description: 'Interview Prep', synonyms: ['Mock interview'] },
  { code: 'C077', description: 'Housing Provider Liaison', synonyms: ['Landlord', 'Council'] },
  { code: 'C078', description: 'Hostel Check', synonyms: ['AP', 'Approved Premises'] },
  { code: 'C079', description: 'Temporary Accommodation', synonyms: ['B&B', 'Emergency housing'] },
  { code: 'C080', description: 'Tenancy Sustainment', synonyms: ['Eviction prevention'] },
  { code: 'C081', description: 'Social Inclusion Activity', synonyms: ['Isolation', 'Loneliness'] },
  { code: 'C082', description: 'Conflict Resolution', synonyms: ['Mediation', 'Anti-social behaviour'] },
  { code: 'C083', description: 'Anti-Social Behaviour Review', synonyms: ['ASB', 'Civil injunction'] },
  { code: 'C084', description: 'Curfew Review', synonyms: ['Tagging hours'] },
  { code: 'C085', description: 'Exclusion Zone Review', synonyms: ['Map', 'No go area'] },
  { code: 'C086', description: 'Non-Association Review', synonyms: ['Co-defendants', 'Keep apart'] },
  { code: 'C087', description: 'Polygraph Session', synonyms: ['Lie detector'] },
  { code: 'C088', description: 'Serious Crime Prevention Order', synonyms: ['SCPO', 'Restriction'] },
]

/**
 * FUZZY SEARCH SERVICE
 */
export default class ContactTypeSearchService {
  private fuse: Fuse<ContactType>

  constructor() {
    const options = {
      includeScore: true, // Useful for debugging relevance
      shouldSort: true, // High scores at top
      threshold: 0.35, // Sensitivity: Lower is stricter. 0.35 handles "acomodation" and "emaail" well.
      location: 0,
      distance: 100,
      minMatchCharLength: 2,
      keys: [
        { name: 'description', weight: 1 },
        { name: 'synonyms', weight: 0.7 }, // Synonyms are very helpful for "Call" -> "Phone"
      ],
    }

    this.fuse = new Fuse(CONTACT_TYPES, options)
  }

  /**
   * Performs the fuzzy search
   */
  search(query: string): ContactType[] {
    if (!query || query.trim() === '') return CONTACT_TYPES

    const results = this.fuse.search(query)
    return results.map(result => result.item)
  }
}

/**
 * --- POC EXECUTION / TEST CASES ---
 * This part runs when you execute the file via ts-node
 */
const searchService = new ContactTypeSearchService()

const runTest = (query: string) => {
  console.log(`\nSEARCH QUERY: "${query}"`)
  const results = searchService.search(query)
  if (results.length > 0) {
    // Show top 5 results
    results.slice(0, 5).forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.description} (${r.code})`)
    })
  } else {
    console.log('  No results found.')
  }
}

console.log('=== CONTACT TYPE FUZZY SEARCH POC (88 ITEMS) ===')

// Scenario 1: Misspellings
runTest('acomodation')

// Scenario 2: Typos
runTest('emaail')

// Scenario 3: Partial Phrases
runTest('mail')

// Scenario 4: Synonyms (Requirement: "Call" should find "Phone")
runTest('Call')

// Scenario 5: Contextual keywords
runTest('housing')

// Scenario 6: Acronyms/Shortcuts
runTest('UPW')

// Running instructions.
// npx ts-node fuzzySearchPOC.ts
