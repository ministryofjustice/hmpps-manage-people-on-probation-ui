import { DateTime } from 'luxon'
import {
  charsOrLess,
  isEmail,
  isNotEmpty,
  isNotLaterThan,
  isNotLaterThanToday,
  isNumeric,
  isUkPostcode,
  isValidDate,
  validateWithSpec,
  ValidationSpec,
} from './validationUtils'
import { PersonalDetailsUpdateRequest } from '../data/model/personalDetails'
import { personDetailsValidation } from '../properties'

describe('is email address', () => {
  it.each([
    ['empty string', '', false],
    ['null', null, false],
    ['undefined', undefined, false],
    ['invalid', 'com.com.com', false],
    ['valid', 'test.test@test.com', true],
  ])('%s isEmail(%s, %s)', (_: string, a: string, expected: boolean) => {
    expect(isEmail(a)).toEqual(expected)
  })
})

describe('is not empty', () => {
  it.each([
    ['empty string', [''], false],
    ['null', [null], false],
    ['undefined', [undefined], false],
    ['populated', ['asdsad'], true],
  ])('%s isEmail(%s, %s)', (_: string, a: [], expected: boolean) => {
    expect(isNotEmpty(a)).toEqual(expected)
  })
})

describe('is numeric', () => {
  it.each([
    ['empty string', [''], false],
    ['null', [null], false],
    ['undefined', [undefined], false],
    ['number with spaces', ['0191 284 65 68'], true],
    ['decimal', ['1.0'], false],
    ['populated char', ['asdsad'], false],
    ['populated numeric', ['123'], true],
  ])('%s isNumeric(%s, %s)', (_: string, a: [], expected: boolean) => {
    expect(isNumeric(a)).toEqual(expected)
  })
})

describe('is uk postcode', () => {
  it.each([
    ['empty string', [''], false],
    ['null', [null], false],
    ['undefined', [undefined], false],
    ['populated valid', ['NE1 1PZ'], true],
    ['populated invalid', ['1789XYZ'], false],
  ])('%s isNumeric(%s, %s)', (_: string, a: [], expected: boolean) => {
    expect(isUkPostcode(a)).toEqual(expected)
  })
})

describe('is chars or less', () => {
  it.each([
    ['empty string', [3, ''], true],
    ['null', [3, null], true],
    ['undefined', [3, undefined], true],
    ['populated valid', [3, 'XXX'], true],
    ['populated valid', [3, 'XX'], true],
    ['populated invalid', [3, 'XXLL'], false],
  ])('%s charsOrLess(%s, %s)', (_: string, a: [], expected: boolean) => {
    expect(charsOrLess(a)).toEqual(expected)
  })
})

describe('is valid date', () => {
  it.each([
    ['empty string', [''], false],
    ['null', [null], false],
    ['undefined', [undefined], false],
    ['populated valid', ['1/2/2025'], true],
    ['populated invalid', ['XXDFDS'], false],
  ])('%s isValidDate(%s, %s)', (_: string, a: [], expected: boolean) => {
    expect(isValidDate(a)).toEqual(expected)
  })
})

describe('is not later than today', () => {
  it.each([
    ['empty string', [''], true],
    ['null', [null], true],
    ['undefined', [undefined], true],
    ['populated invalid date', ['XXDFDS'], false],
    ['populated valid', [DateTime.now().plus({ days: -1 }).toFormat('d/M/yyyy').toString()], true],
    ['populated valid', [DateTime.now().toFormat('d/M/yyyy').toString()], true],
    ['populated invalid', [DateTime.now().plus({ days: 1 }).toFormat('d/M/yyyy').toString()], false],
  ])('%s isNotLaterThanToday(%s, %s)', (_: string, a: [], expected: boolean) => {
    expect(isNotLaterThanToday(a)).toEqual(expected)
  })
})

describe('date which is not later than date', () => {
  it.each([
    ['empty string', ['', ''], true],
    ['null', [null], true],
    ['undefined', [undefined], true],
    ['populated invalid date', ['XXDFDS', '02/02/2024'], true],
    ['populated valid', ['01/02/2024', '02/02/2024'], true],
    ['populated valid', ['02/02/2024', '01/02/2024'], false],
  ])('%s isNotLaterThan(%s, %s)', (_: string, a: [], expected: boolean) => {
    expect(isNotLaterThan(a)).toEqual(expected)
  })
})

describe('validates edit personal contact details request with spec', () => {
  const testRequest: PersonalDetailsUpdateRequest = {
    phoneNumber: 'sakjdhaskdhjsakdkj',
    mobileNumber: 'sakjdhaskdhjsakdkj',
    emailAddress: 'test',
  }
  const expectedResult: Record<string, string> = {
    emailAddress: 'Enter an email address in the correct format.',
    mobileNumber: 'Enter a mobile number in the correct format.',
    phoneNumber: 'Enter a phone number in the correct format.',
  }
  it.each([['empty string', testRequest, personDetailsValidation(false), expectedResult]])(
    '%s validateWithSpec(%s, %s)',
    (_: string, a: PersonalDetailsUpdateRequest, b: ValidationSpec, expected: Record<string, string>) => {
      expect(validateWithSpec(a, b)).toEqual(expected)
    },
  )
})

describe('validates edit main address request with spec', () => {
  const testRequest: PersonalDetailsUpdateRequest = {
    buildingName: 'x'.repeat(36),
    postcode: 'INVALID',
    startDate: 'ENDDATE',
    endDate: DateTime.now().plus({ days: 1 }).toFormat('d/M/yyyy').toString(),
  }
  const expectedResult: Record<string, string> = {
    addressTypeCode: 'Select an address type.',
    buildingName: 'Building name must be 35 characters or less.',
    endDate: 'End date can not be later than today.',
    postcode: 'Enter a full UK postcode.',
    startDate: 'Enter or select a start date.',
    verified: 'Select yes if the address is verified.',
  }
  it.each([['empty string', testRequest, personDetailsValidation(true), expectedResult]])(
    '%s validateWithSpec(%s, %s)',
    (_: string, a: PersonalDetailsUpdateRequest, b: ValidationSpec, expected: Record<string, string>) => {
      expect(validateWithSpec(a, b)).toEqual(expected)
    },
  )
})
