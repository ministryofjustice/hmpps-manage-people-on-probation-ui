import { DateTime } from 'luxon'
import logger from '../../logger'
import {
  charsOrLess,
  getNestedValue,
  hasNestedKeys,
  isEmail,
  isNotEarlierThan,
  timeIsNotEarlierThan,
  isNotEmpty,
  isNotLaterThan,
  isNotLaterThanToday,
  isNumeric,
  isStringNumber,
  isUkPostcode,
  isValidDate,
  isValidDateFormat,
  validateWithSpec,
  timeIsNotLaterThan,
  isTodayOrLater,
  timeIsNowOrInFuture,
  isValidCharCount,
  timeIsValid24HourFormat,
  contactPrefEmailCheck,
  hasAllDigits,
  contactPrefMobileCheck,
  isValidMobileNumber,
  isFutureDate,
} from './validationUtils'
import { PersonalDetailsUpdateRequest } from '../data/model/personalDetails'
import {
  activityLogValidation,
  appointmentsValidation,
  type AppointmentsValidationArgs,
  documentSearchValidation,
  personDetailsValidation,
  eSuperVisionValidation,
  ESupervisionValidationArgs,
} from '../properties'
import { Validateable, ValidationSpec } from '../models/Errors'

const loggerSpy = jest.spyOn(logger, 'info')
const crn = 'X000001'
const id = 'bfb940b1-77ab-45a6-8f3c-aa481c403555'

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

describe('is today or later', () => {
  it.each([
    ['empty string', [''], false],
    ['null', [null], false],
    ['undefined', [undefined], false],
    ['populated invalid date', ['XXDFDS'], false],
    ['populated valid', [DateTime.now().plus({ days: -1 }).toFormat('d/M/yyyy').toString()], false],
    ['populated valid', [DateTime.now().toFormat('d/M/yyyy').toString()], true],
    ['populated invalid', [DateTime.now().plus({ days: 1 }).toFormat('d/M/yyyy').toString()], true],
  ])('%s isTodayOrLater(%s, %s)', (_: string, a: [], expected: boolean) => {
    expect(isTodayOrLater(a)).toEqual(expected)
  })
})

describe('is a valid mobile number', () => {
  it.each([
    ['empty string', '', false],
    ['null', null, false],
    ['undefined', undefined, false],
    ['invalid', '01632', false],
    ['invalid', '01632 960 000', false],
    ['invalid', '01632960000', false],
    ['invalid', '0163296asfsf', false],
    ['invalid', '0163296a*)(*', false],
    ['valid', '07771 900 900', true],
    ['valid', '07771 900 900 ', true],
    ['valid', ' 07771900900', true],
    ['valid', '07783889300', true],
    ['valid', ' 07783889300 ', true],
    ['valid', '    07771 900 900      ', true],
  ])('%s isValidMobileNumber(%s, %s)', (_: string, a: string, expected: boolean) => {
    expect(isValidMobileNumber(a)).toEqual(expected)
  })
})

describe('time is now or in future', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-07-01T09:00:00Z')) // 10:00 BST
  })
  afterAll(() => {
    jest.useRealTimers()
  })
  it('should return false if date is today, but time is in the past', () => {
    expect(timeIsNowOrInFuture(['1/7/2025', '08:00'])).toEqual(false)
  })
  it('should return true if today and time is now', () => {
    expect(timeIsNowOrInFuture(['1/7/2025', '10:00'])).toEqual(true)
  })
  it('should return true if today and time is in the future', () => {
    expect(timeIsNowOrInFuture(['1/7/2025', '10:15'])).toEqual(true)
  })
  it('should return false if date and time are in the past', () => {
    expect(timeIsNowOrInFuture(['30/6/2025', '08:00'])).toEqual(false)
  })
  it('should return true if date is invalid', () => {
    expect(timeIsNowOrInFuture(['XXDFDS', '08:00'])).toEqual(true)
  })
  it('should return false if date is undefined', () => {
    expect(timeIsNowOrInFuture([undefined, '08:00'])).toEqual(false)
  })
  it('should return true if date and time are in the future', () => {
    expect(timeIsNowOrInFuture(['2/7/2025', '08:00'])).toEqual(true)
  })
  it('should return true if using mock-date and selected date/time is equal', () => {
    const mockNowDate = DateTime.fromISO('2025-07-01T09:00:00.000+01:00')
    expect(timeIsNowOrInFuture(['1/7/2025', '09:00'], mockNowDate)).toEqual(true)
  })

  it('should return false if using mock-date and selected date/time is in past', () => {
    const mockNowDate = DateTime.fromISO('2025-07-01T09:00:00.000+01:00')
    expect(timeIsNowOrInFuture(['30/6/2025', '08:00'], mockNowDate)).toEqual(false)
  })

  it('should return true if using mock-date and selected date/time is in future', () => {
    const mockNowDate = DateTime.fromISO('2025-07-01T09:00:00.000+01:00')
    expect(timeIsNowOrInFuture(['1/7/2025', '10:00'], mockNowDate)).toEqual(true)
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

describe('date which is not later than date', () => {
  it.each([
    ['empty string', ['', ''], true],
    ['null', [null], true],
    ['undefined', [undefined], true],
    ['populated invalid date', ['XXDFDS', '02/02/2024'], true],
    ['populated valid', ['01/02/2024', '02/02/2024'], false],
    ['populated valid', ['02/02/2024', '01/02/2024'], true],
  ])('%s isNotEarlierThan(%s, %s)', (_: string, a: [], expected: boolean) => {
    expect(isNotEarlierThan(a)).toEqual(expected)
  })
})

describe('time which is not later than time', () => {
  it.each([
    ['empty string', ['', ''], true],
    ['null', [null], true],
    ['undefined', [undefined], true],
    ['populated invalid date', ['XXDFDS', '02/02/2024'], true],
    ['populated valid', ['9:45pm', '10:45am'], false],
    ['populated valid', ['9:45pm', '9:45pm'], false],
    ['populated valid', ['9:45am', '10:45am'], true],
  ])('%s timeIsNotLaterThan(%s, %s)', (_: string, a: [], expected: boolean) => {
    expect(timeIsNotLaterThan(a)).toEqual(expected)
  })
})

describe('time which is not earlier than time', () => {
  it.each([
    ['empty string', ['', ''], true],
    ['null', [null], true],
    ['undefined', [undefined], true],
    ['populated invalid date', ['XXDFDS', '02/02/2024'], true],
    ['populated valid', ['9:45am', '10:45am'], false],
    ['populated valid', ['9:45pm', '9:45pm'], false],
    ['populated valid', ['9:45pm', '10:45am'], true],
  ])('%s isNotEarlierThan(%s, %s)', (_: string, a: [], expected: boolean) => {
    expect(timeIsNotEarlierThan(a)).toEqual(expected)
  })
})

describe('isFutureDate', () => {
  it.each([
    [['3/1/2036'], true],
    [['2/2/2036'], true],
    [['2/1/2026'], false],
    [['17/5/2024'], false],
    [['1/1/2026'], false],
    [[undefined], false],
    [[''], false],
    [['31/2/2026'], false],
    [['2026-01-03'], false],
  ])('returns %p for input %p', (inputArgs, expected) => {
    expect(isFutureDate(inputArgs as any)).toBe(expected)
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
  it.each([
    [
      'empty string',
      testRequest,
      personDetailsValidation({ ...testRequest, editingMainAddress: false }),
      expectedResult,
    ],
  ])(
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
  it.each([
    [
      'empty string',
      testRequest,
      personDetailsValidation({ ...testRequest, editingMainAddress: true }),
      expectedResult,
    ],
  ])(
    '%s validateWithSpec(%s, %s)',
    (_: string, a: PersonalDetailsUpdateRequest, b: ValidationSpec, expected: Record<string, string>) => {
      expect(validateWithSpec(a, b)).toEqual(expected)
    },
  )
})

describe('validates appointment repeat request with spec when no repeating option is selected', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const testRequest = {
    appointments: {
      [crn]: {
        [id]: {
          repeating: undefined,
        },
      },
    },
  } as unknown as Validateable
  const expectedResult: Record<string, string> = {
    [`appointments-${crn}-${id}-repeating`]: 'Select if the appointment will repeat',
  }
  const args: AppointmentsValidationArgs = {
    crn,
    id,
    page: 'repeating',
    repeatingValue: undefined,
  }
  const spec = appointmentsValidation(args)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
  it('should log the error', () => {
    validateWithSpec(testRequest, spec)
    expect(loggerSpy).toHaveBeenCalledWith('Appointment repeat not selected')
  })
})
describe(`validates appointment repeat request with spec when no repeating option is 'Yes'`, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const testRequest = {
    appointments: {
      [crn]: {
        [id]: {
          repeating: 'Yes',
        },
      },
    },
  } as unknown as Validateable
  const expectedResult: Record<string, string> = {
    [`appointments-${crn}-${id}-interval`]: 'Select the frequency the appointment will repeat',
    [`appointments-${crn}-${id}-numberOfRepeatAppointments`]: 'Enter the number of times the appointment will repeat',
  }
  const args: AppointmentsValidationArgs = {
    crn,
    id,
    page: 'repeating',
    repeatingValue: 'Yes',
  }
  const spec = appointmentsValidation(args)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
})

describe(`validates appointment repeat request with spec when no repeating option is 'Yes'`, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const testRequest = {
    appointments: {
      [crn]: {
        [id]: {
          repeating: 'Yes',
        },
      },
    },
  } as unknown as Validateable
  const expectedResult: Record<string, string> = {
    [`appointments-${crn}-${id}-interval`]: 'Select the frequency the appointment will repeat',
    [`appointments-${crn}-${id}-numberOfRepeatAppointments`]: 'Enter the number of times the appointment will repeat',
  }
  const args: AppointmentsValidationArgs = {
    crn,
    id,
    page: 'repeating',
    repeatingValue: 'Yes',
  }
  const spec = appointmentsValidation(args)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
})

describe('validates appointment location and date time page request with spec', () => {
  const testRequest = {
    appointments: {
      [crn]: {
        [id]: {
          user: {
            locationCode: 'code',
          },
          date: '21/11/2',
          start: '09:00',
          end: '09:30',
        },
      },
    },
  } as unknown as Validateable
  const expectedResult: Record<string, string> = {
    [`appointments-${crn}-${id}-date`]: 'Enter a date in the correct format, for example 17/5/2024',
  }
  const args = {
    crn,
    id,
    page: 'location-date-time',
  }
  const spec = appointmentsValidation(args)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
  it('should log the error', () => {
    expect(loggerSpy).toHaveBeenCalledWith('Appointment date not entered in correct format')
  })
})

describe('validates contacts filter request with spec', () => {
  const testRequest = {
    dateFrom: '10/4/2025',
    dateTo: '6/4/2025',
  }
  const expectedResult: Record<string, string> = {
    dateTo: 'The date to must be on or after the date from',
  }
  const spec = activityLogValidation(false, false)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
})

describe('validates documents filter request with spec', () => {
  const testRequest = {
    dateFrom: '10/4/2025',
  }
  const expectedResult: Record<string, string> = {
    dateTo: 'Enter or select a to date',
  }
  const spec = documentSearchValidation()
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
})

describe('isValidDateFormat()', () => {
  it('should return true if a correct date format', () => {
    expect(isValidDateFormat(['9/4/2025'])).toEqual(true)
  })
  it('should return true if a correct date format', () => {
    expect(isValidDateFormat(['19/10/2025'])).toEqual(true)
  })
  it('should return false if date is not correct format', () => {
    expect(isValidDateFormat(['09/04/2025'])).toEqual(false)
  })
  it('should return false if date is not correct format', () => {
    expect(isValidDateFormat(['19/04/2025'])).toEqual(false)
  })
  it('should return false if date is not correct format', () => {
    expect(isValidDateFormat(['19/04/25'])).toEqual(false)
  })
  it('should return false if date is not correct format', () => {
    expect(isValidDateFormat(['9/4/25'])).toEqual(false)
  })
})
describe('isStringNumber()', () => {
  it('should return true if string value is a number', () => {
    expect(isStringNumber(['12'])).toEqual(true)
    expect(isStringNumber(['0'])).toEqual(true)
    expect(isStringNumber(['0'])).toEqual(true)
  })
  it('should return false if string value is not a number', () => {
    expect(isStringNumber(['a'])).toEqual(false)
    expect(isStringNumber(['&'])).toEqual(false)
  })
})

describe('getNestedValue()', () => {
  it('should return the nested value', () => {
    const path = ['appointments', crn, id, 'type']
    const mockData = {
      appointments: {
        [crn]: {
          [id]: {
            type: 'Home visit',
          },
        },
      },
    }
    expect(getNestedValue(mockData, path)).toEqual('Home visit')
  })
  it('should return undefined', () => {
    const path = ['appointments', crn, id, 'type']
    const mockData = {
      appointments: {
        [crn]: {
          [id]: {
            sentence: '',
          },
        },
      },
    }
    expect(getNestedValue(mockData, path)).toBeUndefined()
  })
  it('should return undefined', () => {
    const path = ['appointments', crn, id, 'type']
    const mockData = {
      appointments: {
        [crn]: {
          [id]: {
            sentence: null,
          },
        },
      },
    } as any
    expect(getNestedValue(mockData, path)).toBeUndefined()
  })
})

describe('hasNestedKeys()', () => {
  it('should return true if all keys are in object', () => {
    const path = ['appointments', crn, id, 'type']
    const mockData = {
      appointments: {
        [crn]: {
          [id]: {
            type: 'Home visit',
          },
        },
      },
    }
    expect(hasNestedKeys(mockData, path)).toEqual(true)
  })
  it('should return false if not all keys are in object', () => {
    const path = ['appointments', crn, id, 'sentence']
    const mockData = {
      appointments: {
        [crn]: {
          [id]: {
            type: 'Home visit',
          },
        },
      },
    }
    expect(hasNestedKeys(mockData, path)).toEqual(false)
  })
})

describe('isValidCharCount', () => {
  it('should return true if no value', () => {
    expect(isValidCharCount([null])).toEqual(true)
  })
  it('should return true if value is less than 12000 chars', () => {
    const value = 'x'.repeat(12000)
    expect(isValidCharCount([value])).toEqual(true)
  })
  it('should return false if value is more than 12000 chars', () => {
    const value = 'x'.repeat(12001)
    expect(isValidCharCount([value])).toEqual(false)
  })
  it('should return false if value including line breaks is more than 12000 chars', () => {
    const paragraph = 'x'.repeat(3000)
    const value = `${paragraph}\r\n${paragraph}\r\n${paragraph}\r\n${paragraph}`
    expect(isValidCharCount([value])).toEqual(false)
  })

  describe('time is in 24 hours format', () => {
    it('should return true for valid 24-hour time', () => {
      expect(timeIsValid24HourFormat([null, '09:00'])).toEqual(true)
      expect(timeIsValid24HourFormat([null, '23:59'])).toEqual(true)
      expect(timeIsValid24HourFormat([null, '16:30'])).toEqual(true)
    })

    it('should return false for invalid time format', () => {
      expect(timeIsValid24HourFormat([null, '24:00'])).toEqual(false)
      expect(timeIsValid24HourFormat([null, '12:60'])).toEqual(false)
      expect(timeIsValid24HourFormat([null, '12'])).toEqual(false)
      expect(timeIsValid24HourFormat([null, ''])).toEqual(false)
    })
  })

  describe('Should check contactPreference for Email', () => {
    test('returns true for no preference', () => {
      expect(contactPrefEmailCheck([undefined])).toBe(true)
      expect(contactPrefEmailCheck(['PHONE'])).toBe(true)
    })

    test('returns true for valid email case', () => {
      expect(contactPrefEmailCheck(['EMAIL', 'test@example.com'])).toBe(true)
      expect(contactPrefEmailCheck(['EMAIL', 'user.name+tag+sorting@example.com'])).toBe(true)
      expect(contactPrefEmailCheck(['EMAIL', 'firstname.surname@example.com'])).toBe(true)
    })

    test('returns false for invalid email case', () => {
      expect(contactPrefEmailCheck(['EMAIL', 'plainaddress'])).toBe(false)
      expect(contactPrefEmailCheck(['EMAIL', '@missingusername.com'])).toBe(false)
      expect(contactPrefEmailCheck(['EMAIL', 'user@.com'])).toBe(false)
      expect(contactPrefEmailCheck(['EMAIL', 'user@@example.com'])).toBe(false)
    })

    test('returns false for EMAIL preference with no email', () => {
      expect(contactPrefEmailCheck(['EMAIL', ''])).toBe(false)
      expect(contactPrefEmailCheck(['EMAIL', undefined])).toBe(false)
    })
  })

  describe('Mobile Utility Functions', () => {
    describe('hasAllDigits', () => {
      test('valid digit strings', () => {
        expect(hasAllDigits('123456')).toBe(true)
        expect(hasAllDigits('0')).toBe(true)
        expect(hasAllDigits('9876543210')).toBe(true)
      })

      test('invalid digit strings', () => {
        expect(hasAllDigits('123abc')).toBe(false)
        expect(hasAllDigits('12.34')).toBe(false)
        expect(hasAllDigits('123-456')).toBe(false)
        expect(hasAllDigits('')).toBe(false)
        expect(hasAllDigits(undefined)).toBe(false)
      })
    })

    describe('Should check contactPreference for Mobile', () => {
      test('returns true for no preference', () => {
        expect(contactPrefMobileCheck([undefined])).toBe(true)
        expect(contactPrefMobileCheck(['EMAIL'])).toBe(true)
      })

      test('returns true for valid digits case', () => {
        expect(contactPrefMobileCheck(['PHONE', '07771 900 900'])).toBe(true)
        expect(contactPrefMobileCheck(['PHONE', '07771900900'])).toBe(true)
      })

      test('returns false for landline number', () => {
        expect(contactPrefMobileCheck(['PHONE', '0123456999'])).toBe(false)
      })

      test('returns false for invalid digits case', () => {
        expect(contactPrefMobileCheck(['PHONE', '123abc'])).toBe(false)
        expect(contactPrefMobileCheck(['PHONE', '12.34'])).toBe(false)
        expect(contactPrefMobileCheck(['PHONE', '123-456'])).toBe(false)
      })

      test('returns false for PHONE preference with no digits', () => {
        expect(contactPrefMobileCheck(['PHONE', ''])).toBe(false)
        expect(contactPrefMobileCheck(['PHONE', undefined])).toBe(false)
      })
    })
  })
})

describe('validates checkin contact type preference', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const testRequest = {
    esupervision: {
      [crn]: {
        [id]: {
          checkins: { preferredComs: undefined },
        },
      },
    },
  } as unknown as Validateable
  const expectedResult: Record<string, string> = {
    [`esupervision-${crn}-${id}-checkins-preferredComs`]:
      'Select how the person wants us to send a link to the service',
    [`esupervision-${crn}-${id}-checkins-checkInMobile`]: 'Enter a mobile number',
    [`esupervision-${crn}-${id}-checkins-checkInEmail`]: 'Enter an email address',
  }
  const args: ESupervisionValidationArgs = {
    crn,
    id,
    page: 'contact-preference',
    checkInMobile: '',
    checkInEmail: '',
    change: 'main',
  }
  const spec = eSuperVisionValidation(args)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
  it('should log the error', () => {
    validateWithSpec(testRequest, spec)
    expect(loggerSpy).toHaveBeenCalledWith('Select how to send service link, not selected')
  })
})

describe('validates checkin date preference', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const testRequest = {
    esupervision: {
      [crn]: {
        [id]: {
          checkins: { interval: undefined },
        },
      },
    },
  } as unknown as Validateable
  const expectedResult: Record<string, string> = {
    [`esupervision-${crn}-${id}-checkins-date`]:
      'Enter the date you would like the person to complete their first check in',
    [`esupervision-${crn}-${id}-checkins-interval`]: 'Select how often you would like the person to check in',
  }
  const args: ESupervisionValidationArgs = {
    crn,
    id,
    page: 'date-frequency',
    checkInMobile: '',
    checkInEmail: '',
  }
  const spec = eSuperVisionValidation(args)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
  it('should log the error', () => {
    validateWithSpec(testRequest, spec)
    expect(loggerSpy).toHaveBeenCalledWith('Checkin frequency not selected')
  })
})

describe('validates edit contact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const testRequest = {
    esupervision: {
      [crn]: {
        [id]: {
          checkins: { editCheckInMobile: '071838893dsafsadf', editCheckInEmail: 'address1gmail.com' },
        },
      },
    },
  } as unknown as Validateable
  const expectedResult: Record<string, string> = {
    [`esupervision-${crn}-${id}-checkins-editCheckInMobile`]: 'Enter a mobile number in the correct format.',
    [`esupervision-${crn}-${id}-checkins-editCheckInEmail`]: 'Enter an email address in the correct format.',
  }
  const args: ESupervisionValidationArgs = {
    crn,
    id,
    page: 'edit-contact-preference',
    editCheckInMobile: '071838893dsafsadf',
    editCheckInEmail: 'address1gmail.com',
  }
  const spec = eSuperVisionValidation(args)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
  it('should log the error', () => {
    validateWithSpec(testRequest, spec)
    expect(loggerSpy).toHaveBeenCalledWith('Mobile number not in correct format in check in process')
  })
})

describe('validates photo options page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const testRequest = {
    esupervision: {
      [crn]: {
        [id]: {
          checkins: { photoUploadOption: undefined },
        },
      },
    },
  } as unknown as Validateable
  const expectedResult: Record<string, string> = {
    [`esupervision-${crn}-${id}-checkins-photoUploadOption`]: 'Select an option to continue',
  }
  const args: ESupervisionValidationArgs = {
    crn,
    id,
    page: 'photo-options',
  }
  const spec = eSuperVisionValidation(args)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
  it('should log the error', () => {
    validateWithSpec(testRequest, spec)
    expect(loggerSpy).toHaveBeenCalledWith('Photo option, not selected')
  })
})

describe('validates upload a photo page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const testRequest = {
    esupervision: {
      [crn]: {
        [id]: {
          checkins: { photoUpload: undefined },
        },
      },
    },
  } as unknown as Validateable
  const expectedResult: Record<string, string> = {
    photoUpload: 'Select a photo of the person',
  }
  const args: ESupervisionValidationArgs = {
    crn,
    id,
    page: 'upload-a-photo',
  }
  const spec = eSuperVisionValidation(args)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
  it('should log the error', () => {
    validateWithSpec(testRequest, spec)
    expect(loggerSpy).toHaveBeenCalledWith('Photo not selected.')
  })
})

describe('validates manage checkin settings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const testRequest = {
    esupervision: {
      [crn]: {
        [id]: {
          manageCheckin: { interval: undefined },
        },
      },
    },
  } as unknown as Validateable
  const expectedResult: Record<string, string> = {
    [`esupervision-${crn}-${id}-manageCheckin-date`]:
      'Enter the date you would like the person to complete their first check in',
  }
  const args: ESupervisionValidationArgs = {
    crn,
    id,
    page: 'checkin-settings',
    checkInMobile: '',
    checkInEmail: '',
  }
  const spec = eSuperVisionValidation(args)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
  it('should log the error', () => {
    validateWithSpec(testRequest, spec)
    expect(loggerSpy).toHaveBeenCalledWith('Checkin date not entered')
  })
})

describe('validates stop checkin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const testRequest = {
    esupervision: {
      [crn]: {
        [id]: {
          manageCheckin: { stopCheckin: undefined },
        },
      },
    },
  } as unknown as Validateable
  const expectedResult: Record<string, string> = {
    [`esupervision-${crn}-${id}-manageCheckin-stopCheckin`]: 'Select yes if you want to stop check ins for the person',
  }
  const args: ESupervisionValidationArgs = {
    crn,
    id,
    page: 'stop-checkin',
    stopCheckIn: '',
  }
  const spec = eSuperVisionValidation(args)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
  it('should log the error', () => {
    validateWithSpec(testRequest, spec)
    expect(loggerSpy).toHaveBeenCalledWith('Stop checkin, not selected')
  })
})

describe('validates stop checkin reason', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const testRequest = {
    esupervision: {
      [crn]: {
        [id]: {
          manageCheckin: { stopCheckin: 'YES', reason: undefined },
        },
      },
    },
  } as unknown as Validateable
  const expectedResult: Record<string, string> = {
    [`esupervision-${crn}-${id}-manageCheckin-reason`]: 'Enter the reason for stopping',
  }
  const args: ESupervisionValidationArgs = {
    crn,
    id,
    page: 'stop-checkin',
    stopCheckIn: 'YES',
  }
  const spec = eSuperVisionValidation(args)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
  it('should log the error', () => {
    validateWithSpec(testRequest, spec)
    expect(loggerSpy).toHaveBeenCalledWith('Stop checkin, reason not provided')
  })
})

describe('validates manage edit contact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const testRequest = {
    esupervision: {
      [crn]: {
        [id]: {
          manageCheckin: { editCheckInMobile: '071838893dsafsadf', editCheckInEmail: 'address1gmail.com' },
        },
      },
    },
  } as unknown as Validateable
  const expectedResult: Record<string, string> = {
    [`esupervision-${crn}-${id}-manageCheckin-editCheckInMobile`]: 'Enter a mobile number in the correct format.',
    [`esupervision-${crn}-${id}-manageCheckin-editCheckInEmail`]: 'Enter an email address in the correct format.',
  }
  const args: ESupervisionValidationArgs = {
    crn,
    id,
    page: 'edit-contact',
    editCheckInMobile: '071838893dsafsadf',
    editCheckInEmail: 'address1gmail.com',
  }
  const spec = eSuperVisionValidation(args)
  it('should return the correct validation errors', () => {
    expect(validateWithSpec(testRequest, spec)).toEqual(expectedResult)
  })
  it('should log the error', () => {
    validateWithSpec(testRequest, spec)
    expect(loggerSpy).toHaveBeenCalledWith('Mobile number not in correct format in check in process')
  })
})
