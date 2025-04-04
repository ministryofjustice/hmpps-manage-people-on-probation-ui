import httpMocks from 'node-mocks-http'
import { DateTime } from 'luxon'
import { govukTime } from './govukTime'
import { checkRecentlyViewedAccess, makePageTitle, groupByLevel, toSentenceCase, getSearchParamsString } from './utils'
import { getRisksToThemselves, pastAppointments } from '.'
import { Need, RiskResponse, RiskScore, RiskToSelf } from '../data/arnsApiClient'
import { Activity } from '../data/model/schedule'
import { RecentlyViewedCase, UserAccess } from '../data/model/caseAccess'
import config from '../config'
import { RiskFlag } from '../data/model/risk'

const appointments = [
  {
    startDateTime: DateTime.now().plus({ days: 4 }).toString(),
  },
  {
    startDateTime: DateTime.now().plus({ days: 3 }).toString(),
  },
  {
    startDateTime: DateTime.now().plus({ days: 2 }).toString(),
  },
  {
    startDateTime: DateTime.now().minus({ days: 1 }).toString(),
    isNationalStandard: true,
    isAppointment: true,
    hasOutcome: true,
  },
  {
    startDateTime: DateTime.now().minus({ days: 2 }).toString(),
    isNationalStandard: true,
    absentWaitingEvidence: true,
    isAppointment: true,
  },
  {
    startDateTime: DateTime.now().minus({ days: 3 }).toString(),
    hasOutcome: false,
  },
  {
    startDateTime: DateTime.now().minus({ days: 4 }).toString(),
    hasOutcome: true,
  },
]

describe('govuk Time', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['Date String ', '2024-05-25T09:08:34.123', '9:08am'],
  ])('%s govukTime(%s, %s)', (_: string, a: string, expected: string) => {
    expect(govukTime(a)).toEqual(expected)
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

describe('get past Appointments', () => {
  it.each([['Filters correctly', appointments]])('%s pastAppointments(%s, %s)', (_: string, a: Activity[]) => {
    expect(pastAppointments(a)[0]).toEqual(appointments[6])
  })
})

describe('update lao access in local storage', () => {
  it.each([
    [
      'sets limited access to true for exclusion',
      [{ crn: 'X123456' }],
      { access: [{ crn: 'X123456', userExcluded: true }] },
      true,
    ],
    [
      'sets limited access to true for restriction',
      [{ crn: 'X123456' }],
      { access: [{ crn: 'X123456', userRestricted: true }] },
      true,
    ],
    [
      'sets limited access to false for false restriction',
      [{ crn: 'X123456' }],
      { access: [{ crn: 'X123456', userRestricted: false }] },
      false,
    ],
    [
      'sets limited access to false for false exclusion',
      [{ crn: 'X123456' }],
      { access: [{ crn: 'X123456', userExcluded: false }] },
      false,
    ],
    [
      'sets limited access to false for no restriction or exclusion',
      [{ crn: 'X123456' }],
      { access: [{ crn: 'X123456' }] },
      false,
    ],
  ])('%s checkRecentlyViewedAccess(%s, %s)', (_: string, a: RecentlyViewedCase[], b: UserAccess, expected: boolean) => {
    const result = checkRecentlyViewedAccess(a, b)
    expect(result[0].limitedAccess).toEqual(expected)
  })
})

describe('makePageTitle()', () => {
  it('should format the title correctly if heading is a single string value', () => {
    expect(makePageTitle({ pageHeading: 'Home' })).toEqual(`Home - ${config.applicationName}`)
  })
  it('should format the title correctly if heading is an array containing two values', () => {
    expect(makePageTitle({ pageHeading: ['Contact', 'Personal details'] })).toEqual(
      `Contact - Personal details - ${config.applicationName}`,
    )
  })
  it('should format the title correctly if heading is an array containing three values', () => {
    expect(makePageTitle({ pageHeading: ['Contact', 'Sentence', 'Licence condition'] })).toEqual(
      `Contact - Sentence - Licence condition - ${config.applicationName}`,
    )
  })
})

describe('groupByLevel()', () => {
  it('should return filtered needs', () => {
    const mockNeeds: Need[] = [
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
    ]
    expect(groupByLevel('STANDARD', mockNeeds)).toEqual(mockNeeds.filter(need => need?.severity === 'STANDARD'))
  })
  it('should return filtered risk flags', () => {
    const mockRiskFlags: RiskFlag[] = [
      {
        id: 1,
        level: 'HIGH',
        description: 'Restraining Order',
        notes: 'Some notes',
        createdDate: '2022-12-18',
        nextReviewDate: '2024-12-15',
        createdBy: { forename: 'Paul', surname: 'Smith' },
        removed: false,
        removalHistory: [],
      },
      {
        id: 2,
        description: 'Domestic Abuse Perpetrator',
        level: 'MEDIUM',
        notes: 'Some notes',
        nextReviewDate: '2025-08-18',
        mostRecentReviewDate: '2023-12-18',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Paul', surname: 'Smith' },
        removed: false,
        removalHistory: [],
      },
      {
        id: 3,
        description: 'Risk to Known Adult',
        level: 'LOW',
        notes: 'Some notes',
        nextReviewDate: '2025-08-18',
        mostRecentReviewDate: '2023-12-18',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Paul', surname: 'Smith' },
        removed: false,
        removalHistory: [],
      },
      {
        id: 4,
        description: 'Domestic Abuse Perpetrator',
        level: 'INFORMATION_ONLY',
        notes: 'Some notes',
        nextReviewDate: '2025-08-18',
        mostRecentReviewDate: '2023-12-18',
        createdDate: '2022-12-18',
        createdBy: { forename: 'Paul', surname: 'Smith' },
        removed: false,
        removalHistory: [],
      },
    ]
    expect(groupByLevel('MEDIUM', mockRiskFlags)).toEqual(mockRiskFlags.filter(riskFlag => riskFlag.level === 'MEDIUM'))
  })
})
describe('toSentenceCase()', () => {
  it('should expect one argument', () => {
    expect(toSentenceCase.length).toEqual(1)
  })
  it('should return an empty string if argument is undefined, null or an empty string', () => {
    expect(toSentenceCase(null)).toEqual('')
    expect(toSentenceCase(undefined)).toEqual('')
    expect(toSentenceCase('')).toEqual('')
  })
  it('should return the correctly formatted string if argument is a capitalised snake case value', () => {
    expect(toSentenceCase('SNAKE_CASE_VALUE')).toEqual('Snake case value')
  })
  it('should return the correctly formatted string if argument is a train case value', () => {
    expect(toSentenceCase('train-case-value')).toEqual('Train case value')
  })
  it('should return the correctly formatted string if argument is a capitalised value', () => {
    expect(toSentenceCase('A CAPITALISED VALUE')).toEqual('A capitalised value')
  })
  it('should return the correctly formatted string if argument is a camel cased value', () => {
    expect(toSentenceCase('Camel Cased Value')).toEqual('Camel cased value')
  })
})

describe('getSearchParamsString()', () => {
  it('should return an empty string if no query string', () => {
    const req = httpMocks.createRequest({
      query: {
        page: '2',
      },
    })
    const searchParamString = getSearchParamsString({ req, ignore: ['page'] })
    expect(searchParamString).toEqual('')
  })
  it('should return only the prefix if no query string but showPrefix = true', () => {
    const req = httpMocks.createRequest({
      query: {
        page: '2',
      },
    })
    const searchParamString = getSearchParamsString({ req, ignore: ['page'], showPrefixIfNoQuery: true })
    expect(searchParamString).toEqual('?')
  })
  it('should return the full search param string and the suffix', () => {
    const req = httpMocks.createRequest({
      query: {
        page: '2',
        sortBy: 'name.asc',
      },
    })
    const searchParamString = getSearchParamsString({ req, suffix: '&' })
    expect(searchParamString).toEqual('?page=2&sortBy=name.asc&')
  })
  it('should not add the prefix', () => {
    const req = httpMocks.createRequest({
      query: {
        page: '2',
        sortBy: 'name.asc',
      },
    })
    const searchParamString = getSearchParamsString({ req, prefix: '' })
    expect(searchParamString).toEqual('page=2&sortBy=name.asc')
  })
})
