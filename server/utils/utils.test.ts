// eslint-disable-next-line import/no-extraneous-dependencies
import { DateTime } from 'luxon'
import { Name } from '../data/masApiClient'
import {
  convertToTitleCase,
  dateWithDayAndWithoutYear,
  dateWithYear,
  dateWithYearShortMonth,
  fullName,
  getRiskFlags,
  getRisksToThemselves,
  getTagClass,
  govukTime,
  initialiseName,
  monthsOrDaysElapsed,
  yearsSince,
} from './utils'
import { RiskResponse, RiskScore, RiskSummary, RiskToSelf } from '../data/arnsApiClient'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    ['Null', null, ''],
    ['Not defined', undefined, ''],
    ['Name', { forename: 'Joe', surname: 'Bloggs' }, 'Joe Bloggs'],
  ])('%s fullName(%s, %s)', (_: string, a: Name, expected: string) => {
    expect(fullName(a)).toEqual(expected)
  })
})

describe('date with year', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Date string ', '2023-05-25T09:08:34.123', '25 May 2023'],
  ])('%s dateWithYear(%s, %s)', (_: string, a: string, expected: string) => {
    expect(dateWithYear(a)).toEqual(expected)
  })
})

describe('date with day and withoutYear', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Date string ', '2023-05-25T09:08:34.123', 'Thursday 25 May'],
  ])('%s dateWithDayAndWithoutYear(%s, %s)', (_: string, a: string, expected: string) => {
    expect(dateWithDayAndWithoutYear(a)).toEqual(expected)
  })
})

describe('years since', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Date string ', '1998-05-25T09:08:34.123', '25'],
  ])('%s yearsSince(%s, %s)', (_: string, a: string, expected: string) => {
    expect(yearsSince(a)).toEqual(expected)
  })
})

describe('months or days elapsed since', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Months elapsed ', '1998-05-25T09:08:34.123', '309 months'],
    ['Days elapsed ', DateTime.now().minus({ days: 5 }), '5 days'],
  ])('%s monthsOrDaysElapsed(%s, %s)', (_: string, a: string, expected: string) => {
    expect(monthsOrDaysElapsed(a)).toEqual(expected)
  })
})

describe('govuk Time', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Date String ', '2024-05-25T09:08:34.123', '9:08am'],
  ])('%s govukTime(%s, %s)', (_: string, a: string, expected: string) => {
    expect(govukTime(a)).toEqual(expected)
  })
})

describe('date with year short month', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Date String ', '2024-08-25T09:08:34.123', '25 Aug 2024'],
  ])('%s dateWithYearShortMonth(%s, %s)', (_: string, a: string, expected: string) => {
    expect(dateWithYearShortMonth(a)).toEqual(expected)
  })
})

describe('get risks to themselves', () => {
  const YES: RiskResponse = 'YES'
  const NO: RiskResponse = 'NO'
  const DK: RiskResponse = 'DK'
  const riskOfSelfHarm1 = {
    suicide: {
      risk: YES,
      previous: YES,
      current: YES,
      currentConcernsText: 'Meaningful content for AssSumm Testing - R8.1.1',
    },
  }
  const riskOfSelfHarm2 = {
    suicide: {
      risk: YES,
      previous: YES,
      current: YES,
      currentConcernsText: 'Meaningful content for AssSumm Testing - R8.1.1',
    },
    selfHarm: {
      risk: YES,
      previous: YES,
      current: YES,
      currentConcernsText: 'Meaningful content for AssSumm Testing - R8.1.1',
    },
    custody: {
      risk: YES,
      previous: YES,
      current: YES,
      currentConcernsText: 'Meaningful content for AssSumm Testing - R8.1.1',
    },
    hostelSetting: {
      risk: YES,
      previous: YES,
      current: DK,
      currentConcernsText: 'Meaningful content for AssSumm Testing - R8.1.1',
    },
    vulnerability: {
      risk: YES,
      previous: YES,
      current: NO,
      currentConcernsText: 'Meaningful content for AssSumm Testing - R8.1.1',
    },
  }

  it.each([
    [null, null, null, []],
    ['Valid Risk to Self no type', riskOfSelfHarm1, null, []],
    ['Valid Risk to Self with type', riskOfSelfHarm2, 'current', ['suicide', 'self harm', 'coping in custody']],
  ])('%s getRisksToThemselves %s %s %s', (_: string, a: RiskToSelf, b: string, expected: string[]) => {
    expect(getRisksToThemselves(a, b)).toEqual(expected)
  })
})

describe('get risk factors', () => {
  const YES: RiskResponse = 'YES'
  const HIGH: RiskScore = 'HIGH'
  const riskToSelf = {
    suicide: {
      risk: YES,
      previous: YES,
      current: YES,
      currentConcernsText: 'Meaningful content for AssSumm Testing - R8.1.1',
    },
  }
  const riskSummary = {
    riskToSelf,
    summary: {
      whoIsAtRisk: 'NOD-849Meaningful content for AssSumm Testing -  r10.1',
      natureOfRisk: 'NOD-849 Meaningful content for AssSumm Testing -  r10.2',
      riskImminence: 'NOD-849 R10.3Meaningful content for AssSumm Testing - ',
      riskIncreaseFactors: 'NOD-849Meaningful content for AssSumm Testing -  R10.4',
      riskMitigationFactors: 'NOD-849 Meaningful content for AssSumm Testing -  r10.5',
      riskInCommunity: {
        LOW: ['Children', 'Staff'],
      },
      riskInCustody: {
        HIGH: ['Staff'],
      },
      overallRiskLevel: HIGH,
    },
  }

  it.each([
    [null, null, []],
    [
      'Valid Risk summary',
      riskSummary,
      [
        ['LOW', 'Children in the community'],
        ['LOW', 'Staff in the community'],
        ['HIGH', 'Staff in custody'],
      ],
    ],
  ])('%s getRiskFlags %s %s', (_: string, a: RiskSummary, expected: []) => {
    expect(getRiskFlags(a)).toEqual(expected)
  })
})

describe('get tag class', () => {
  const HIGH: RiskScore = 'HIGH'
  const LOW: RiskScore = 'LOW'
  const MEDIUM: RiskScore = 'MEDIUM'
  const VERY_HIGH: RiskScore = 'VERY_HIGH'
  it.each([
    [null, null, 'govuk-tag--blue'],
    ['Low', LOW, 'govuk-tag--green'],
    ['Medium', MEDIUM, 'govuk-tag--yellow'],
    ['High', HIGH, 'govuk-tag--red'],
    ['Very High', VERY_HIGH, 'govuk-tag--red'],
  ])('%s getTagClass(%s, %s)', (_: string, a: RiskScore, expected: string) => {
    expect(getTagClass(a)).toEqual(expected)
  })
})
