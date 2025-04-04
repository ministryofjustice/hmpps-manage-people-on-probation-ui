import { RiskToSelf } from '../../data/arnsApiClient'

export const riskToSelf = {
  suicide: {
    risk: 'YES',
    previous: 'DK',
    current: 'YES',
    currentConcernsText: 'Meaningful content for AssSumm Testing - R8.1.1',
  },
  selfHarm: {
    risk: 'YES',
    previous: 'YES',
    previousConcernsText: 'Meaningful content for AssSumm Testing - r814 ',
    current: 'YES',
    currentConcernsText: 'Meaningful content for AssSumm Testing - R8.1.1',
  },
  custody: {
    risk: 'YES',
    previous: 'DK',
    current: 'YES',
    currentConcernsText: 'Meaningful content for AssSumm Testing -  r821',
  },
  hostelSetting: {
    risk: 'YES',
    previous: 'YES',
    previousConcernsText: 'Meaningful content for AssSumm Testing -  R822',
    current: 'NO',
  },
  vulnerability: {
    risk: 'YES',
    previous: 'NO',
    current: 'YES',
    currentConcernsText: 'Meaningful content for AssSumm Testing -  r831',
  },
} as RiskToSelf
