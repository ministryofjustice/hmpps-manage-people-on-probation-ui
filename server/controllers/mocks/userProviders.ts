import { UserProviders } from '../../data/model/caseload'

export const userProviders: UserProviders = {
  defaultUserDetails: {
    username: 'peter-parker',
    homeArea: 'London',
    team: 'Automated Allocation Team',
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
      description: 'A P Central Admissions Unit',
      code: 'N50CAU',
    },
    {
      description: 'Ascot House Approved Premises',
      code: 'N50AHA',
    },
    {
      description: 'Atherton Court',
      code: 'N50ACT',
    },
  ],
  users: [
    {
      username: 'peter-parker',
      nameAndRole: 'peter parker (PS-PSO)',
    },
    {
      username: 'jon-smith',
      nameAndRole: 'jon smith (PS-PSO)',
    },
  ],
}
