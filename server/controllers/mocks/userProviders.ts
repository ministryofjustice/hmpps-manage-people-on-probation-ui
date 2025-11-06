import { UserProviders } from '../../data/model/caseload'

export const userProviders: UserProviders = {
  defaultUserDetails: {
    username: 'peter-parker',
    homeArea: 'North East Region',
    team: 'Automation SPG',
    staffCode: 'N07B722',
  },
  providers: [
    {
      code: 'N50',
      name: 'Greater Manchester',
    },
    {
      code: 'N07',
      name: 'London',
    },
    {
      code: 'N54',
      name: 'North East Region',
    },
  ],
  teams: [
    {
      description: 'Automated Allocation Team',
      code: 'N07AAT',
    },
    {
      description: 'Automation SPG',
      code: 'N07CHT',
    },
    {
      description: 'Automation Test No Location Warning',
      code: 'N07IVH',
    },
    {
      description: 'Bexley\\Bromley SP TEST1',
      code: 'N07SP1',
    },
  ],
  users: [
    {
      staffCode: 'N07B722',
      username: 'peter-parker',
      nameAndRole: 'Peter Parker (PS - Other)',
    },
    {
      staffCode: 'N57A054',
      username: 'IainChambers',
      nameAndRole: 'Iain Chambers (PS - Other)',
    },
    {
      staffCode: 'N07B795',
      username: 'DeborahFern',
      nameAndRole: 'Deborah Fern (PS - Other)',
    },
  ],
}
