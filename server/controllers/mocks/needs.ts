import { Needs } from '../../data/arnsApiClient'

export const mockNeeds = {
  identifiedNeeds: [
    {
      section: 'ACCOMMODATION',
      name: 'Accommodation',
      riskOfHarm: true,
      riskOfReoffending: true,
      severity: 'STANDARD',
    },
    {
      section: 'EDUCATION_TRAINING_AND_EMPLOYABILITY',
      name: 'Education, Training and Employability',
      riskOfHarm: true,
      riskOfReoffending: true,
      severity: 'STANDARD',
    },
    {
      section: 'RELATIONSHIPS',
      name: 'Relationships',
      riskOfHarm: true,
      riskOfReoffending: true,
      severity: 'SEVERE',
    },
    {
      section: 'LIFESTYLE_AND_ASSOCIATES',
      name: 'Lifestyle and Associates',
      riskOfHarm: true,
      riskOfReoffending: true,
      severity: 'SEVERE',
    },
    {
      section: 'DRUG_MISUSE',
      name: 'Drug Misuse',
      riskOfHarm: true,
      riskOfReoffending: true,
      severity: 'STANDARD',
    },
    {
      section: 'ALCOHOL_MISUSE',
      name: 'Alcohol Misuse',
      riskOfHarm: true,
      riskOfReoffending: true,
      severity: 'STANDARD',
    },
    {
      section: 'THINKING_AND_BEHAVIOUR',
      name: 'Thinking and Behaviour',
      riskOfHarm: true,
      riskOfReoffending: true,
      severity: 'SEVERE',
    },
    {
      section: 'ATTITUDE',
      name: 'Attitudes',
      riskOfHarm: true,
      riskOfReoffending: true,
      severity: 'STANDARD',
    },
  ],
  notIdentifiedNeeds: [
    {
      section: 'EMO_WELLBEING',
      name: 'Emotional wellbeing',
    },
  ],
  unansweredNeeds: [],
  assessedOn: '2023-07-26T11:29:10',
} as Needs
