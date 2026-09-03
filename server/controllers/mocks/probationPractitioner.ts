import { ProbationPractitioner } from '../../models/CaseDetail'

export const probationPractitioner: ProbationPractitioner = {
  code: 'N07B795',
  name: {
    forename: 'Deborah',
    surname: 'Fern',
  },
  provider: {
    code: 'N07',
    name: 'London',
  },
  team: {
    code: 'N07AAT',
    description: 'Automated Allocation Team',
  },
  unallocated: false,
  username: 'DeborahFern',
  email: 'deborah.fern@testemail.com',
}

export const probationPractitionerNoMatch: ProbationPractitioner = {
  code: 'N08B88',
  name: {
    forename: 'Bog',
    surname: 'Trog',
  },
  provider: {
    code: 'N08',
    name: 'Other',
  },
  team: {
    code: 'N08B',
    description: 'Non Match Team',
  },
  unallocated: false,
  username: 'BogTrog',
  email: 'bog.trog@testemail.com',
}
