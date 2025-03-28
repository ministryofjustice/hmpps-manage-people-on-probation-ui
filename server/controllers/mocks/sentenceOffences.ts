import { Offences } from '../../data/model/offences'

export const mockSentenceOffences = {
  name: {
    forename: 'Caroline',
    middleName: '',
    surname: 'Wolff',
  },
  mainOffence: {
    description: 'Possessing etc firearm or ammunition without firearm certificate (Group 1) - 08103',
    category: 'Firearms offences',
    code: '08103',
    date: '2024-04-23',
    count: 1,
    notes: 'overview',
  },
  additionalOffences: [
    {
      description: 'Endangering railway passengers - 00600',
      category: 'Endangering railway passengers',
      code: '00600',
      date: '2024-03-22',
      count: 1,
    },
    {
      description: 'Contravene court remedy order (S.42) - 08505',
      category: 'Health and Safety at Work etc Act 1974',
      code: '08505',
      date: '2024-02-21',
      count: 3,
    },
  ],
} as unknown as Offences
