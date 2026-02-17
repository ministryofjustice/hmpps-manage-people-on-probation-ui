import { Sentences } from '../data/model/sentenceDetails'
import { getSentenceId } from './getSentenceId'

const mockSentences = {
  personSummary: {
    name: {
      forename: 'Caroline',
      surname: 'Wolff',
    },
    crn: 'X000001',
    dateOfBirth: '1979-08-18',
  },
  sentences: [
    {
      id: 49,
      eventNumber: '1234567',
      order: {
        description: 'Pre-Sentence',
      },
      nsis: [],
      licenceConditions: [],
      requirements: [],
    },
    {
      id: 48,
      eventNumber: '7654321',
      order: {
        description: 'Default Sentence Type (12 Months)',
        startDate: '2025-05-31',
      },
      nsis: [],
      licenceConditions: [],
      requirements: [],
    },
  ],
} as unknown as Sentences

describe('getSentenceId()', () => {
  it('should return empty string if no match', () => {
    expect(getSentenceId('9', mockSentences)).toEqual('')
  })
  it('should return the single "Risk to Staff" flag if it exists', () => {
    expect(getSentenceId('1234567', mockSentences)).toEqual('49')
  })
})
