import { SentenceDetails } from '../../data/model/sentenceDetails'

export const mockProbationHistory = {
  personSummary: {
    name: {
      forename: 'Caroline',
      surname: 'Wolff',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  sentenceSummaryList: [
    {
      eventNumber: '3',
      description: 'Default Sentence Type',
    },
    {
      eventNumber: '1',
      description: '12 month community order',
    },
  ],
  probationHistory: {
    numberOfTerminatedEvents: 2,
    dateOfMostRecentTerminatedEvent: '2011-01-21',
    numberOfTerminatedEventBreaches: 2,
    numberOfProfessionalContacts: 3,
  },
} as unknown as SentenceDetails
