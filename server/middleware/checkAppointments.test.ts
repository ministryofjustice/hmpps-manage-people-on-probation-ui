import httpMocks from 'node-mocks-http'
import { dateTime } from '../utils'
import MasApiClient from '../data/masApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { AppResponse } from '../models/Locals'
import { checkAppointments } from './checkAppointments'
import { AppointmentChecks } from '../models/Appointments'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>

jest.mock('../data/masApiClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const crn = 'X000001'
const id = '4715aa09-0f9d-4c18-948b-a42c45bc0974'
const username = 'user-1'
const res = {
  locals: {
    user: {
      username,
    },
    case: { name: { forename: 'Test', surname: 'User' } },
    flags: {
      enablePastAppointments: true,
    },
  },
  render: jest.fn().mockReturnThis(),
  redirect: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const hmppsAuthClient = new HmppsAuthClient(tokenStore)

const req = httpMocks.createRequest({
  params: {
    crn,
    id,
  },
  session: {
    data: {
      appointments: {
        [crn]: {
          [id]: {
            date: '2025-03-12',
            start: '9:00am',
            end: '9:30pm',
          },
        },
      },
    },
  },
})
const secondReq = httpMocks.createRequest({
  params: {
    crn,
    id,
  },
  body: {
    _warningMessagesSeen: 'true',
  },
  session: {
    data: {
      appointments: {
        [crn]: {
          [id]: {
            date: '2025-03-12',
            start: '9:00am',
            end: '9:30pm',
            previousValues: {
              date: '2025-03-12',
              startTime: '9:00am',
              endTime: '9:30pm',
            },
          },
        },
      },
    },
  },
})
const nextSpy = jest.fn()
const renderSpy = jest.spyOn(res, 'render')
const { date, start: startTime, end: endTime } = req.session.data.appointments[crn][id]

const expectedBody = {
  start: dateTime(date, startTime),
  end: dateTime(date, endTime),
}
let spy: jest.SpyInstance

describe('/middleware/checkAppointments shows warnings the first time', () => {
  const mockAppointmentChecks: AppointmentChecks = {
    nonWorkingDayName: 'Sunday',
    isWithinOneHourOfMeetingWith: {
      isCurrentUser: true,
      appointmentIsWith: { forename: 'Test', surname: 'User' },
      startAndEnd: '11am to 12pm',
    },
  }
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-07-01T09:00:00Z')) // 10:00 BST
  })
  afterAll(() => {
    jest.useRealTimers()
  })
  beforeEach(async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-07-01T09:00:00Z')) // 10:00 BST
    spy = jest
      .spyOn(MasApiClient.prototype, 'checkAppointments')
      .mockImplementation(() => Promise.resolve(mockAppointmentChecks))
    await checkAppointments(hmppsAuthClient)(req, res, nextSpy)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should show the warnings the first time', () => {
    expect(spy).toHaveBeenCalledWith(crn, expectedBody)
    expect(renderSpy).toHaveBeenCalledWith('pages/arrange-appointment/location-date-time', {
      crn: 'X000001',
      id: '4715aa09-0f9d-4c18-948b-a42c45bc0974',
      back: '',
      change: '',
      warningMessages: {
        isWithinOneHourOfMeetingWith:
          'You already have an appointment with Test within an hour of this date and time. Continue with these details or make changes.',
        nonWorkingDayName: 'You have selected a non-working day (Sunday). Continue with these details or make changes.',
      },
      isInPast: true,
      _maxDate: '31/12/2199',
    })
  })
  it('should not call next()', () => {
    expect(nextSpy).toHaveBeenCalledTimes(0)
  })
})

describe('/middleware/checkAppointments shows warnings the for a colleague', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-07-01T09:00:00Z')) // 10:00 BST
  })
  afterAll(() => {
    jest.useRealTimers()
  })
  beforeEach(async () => {
    const mockAppointmentChecks: AppointmentChecks = {
      nonWorkingDayName: 'Saturday',
      isWithinOneHourOfMeetingWith: {
        isCurrentUser: false,
        appointmentIsWith: { forename: 'Test', surname: 'User' },
        startAndEnd: '11am to 12pm',
      },
    }
    spy = jest
      .spyOn(MasApiClient.prototype, 'checkAppointments')
      .mockImplementation(() => Promise.resolve(mockAppointmentChecks))
    await checkAppointments(hmppsAuthClient)(req, res, nextSpy)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should show the warnings the first time', () => {
    expect(spy).toHaveBeenCalledWith(crn, expectedBody)
    expect(renderSpy).toHaveBeenCalledWith('pages/arrange-appointment/location-date-time', {
      crn: 'X000001',
      id: '4715aa09-0f9d-4c18-948b-a42c45bc0974',
      back: '',
      change: '',
      warningMessages: {
        isWithinOneHourOfMeetingWith:
          'Test User already has an appointment with Test within an hour of this date and time. Continue with these details or make changes.',
        nonWorkingDayName:
          'You have selected a non-working day (Saturday). Continue with these details or make changes.',
      },
      isInPast: true,
      _maxDate: '31/12/2199',
    })
  })
  it('should not call next()', () => {
    expect(nextSpy).toHaveBeenCalledTimes(0)
  })
})

describe('past appointments feature flag is disabled', () => {
  const mockRes = {
    locals: {
      user: {
        username,
      },
      case: { name: { forename: 'Test', surname: 'User' } },
      flags: {
        enablePastAppointments: false,
      },
    },
    render: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  } as unknown as AppResponse
  const mockRenderSpy = jest.spyOn(mockRes, 'render')
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-07-01T09:00:00Z')) // 10:00 BST
  })
  afterAll(() => {
    jest.useRealTimers()
  })
  beforeEach(async () => {
    const mockAppointmentChecks: AppointmentChecks = {
      nonWorkingDayName: 'Saturday',
      isWithinOneHourOfMeetingWith: {
        isCurrentUser: false,
        appointmentIsWith: { forename: 'Test', surname: 'User' },
        startAndEnd: '11am to 12pm',
      },
    }
    spy = jest
      .spyOn(MasApiClient.prototype, 'checkAppointments')
      .mockImplementation(() => Promise.resolve(mockAppointmentChecks))
    await checkAppointments(hmppsAuthClient)(req, mockRes, nextSpy)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should add the _minDate value to the template properties', () => {
    expect(mockRenderSpy).toHaveBeenCalledWith('pages/arrange-appointment/location-date-time', {
      crn: 'X000001',
      id: '4715aa09-0f9d-4c18-948b-a42c45bc0974',
      back: '',
      change: '',
      warningMessages: {
        isWithinOneHourOfMeetingWith:
          'Test User already has an appointment with Test within an hour of this date and time. Continue with these details or make changes.',
        nonWorkingDayName:
          'You have selected a non-working day (Saturday). Continue with these details or make changes.',
      },
      isInPast: true,
      _maxDate: '31/12/2199',
      _minDate: '1/7/2025',
    })
  })
})

describe('/middleware/checkAppointments does not show warnings the second time', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-07-01T09:00:00Z')) // 10:00 BST
  })
  afterAll(() => {
    jest.useRealTimers()
  })
  beforeEach(async () => {
    const mockAppointmentChecks: AppointmentChecks = {
      nonWorkingDayName: 'Saturday',
      isWithinOneHourOfMeetingWith: {
        isCurrentUser: false,
        appointmentIsWith: { forename: 'Test', surname: 'User' },
        startAndEnd: '11am to 12pm',
      },
    }
    spy = jest
      .spyOn(MasApiClient.prototype, 'checkAppointments')
      .mockImplementation(() => Promise.resolve(mockAppointmentChecks))
    await checkAppointments(hmppsAuthClient)(secondReq, res, nextSpy)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should not show the warnings the second time', () => {
    expect(renderSpy).toHaveBeenCalledTimes(0)
  })
  it('should call next()', () => {
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})

describe('/middleware/checkAppointments does not show any warnings if none are returned', () => {
  beforeEach(async () => {
    const mockAppointmentChecks: AppointmentChecks = {
      nonWorkingDayName: null,
      isWithinOneHourOfMeetingWith: null,
    }
    spy = jest
      .spyOn(MasApiClient.prototype, 'checkAppointments')
      .mockImplementation(() => Promise.resolve(mockAppointmentChecks))
    await checkAppointments(hmppsAuthClient)(req, res, nextSpy)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should show the warnings the first time', () => {
    expect(renderSpy).toHaveBeenCalledTimes(0)
  })
  it('should not call next()', () => {
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})

describe('/middleware/checkAppointments does not show any warnings if checks do not return the required warnings, but shows errors', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-07-01T09:00:00Z')) // 10:00 BST
  })
  afterAll(() => {
    jest.useRealTimers()
  })
  beforeEach(async () => {
    const mockAppointmentChecks: AppointmentChecks = {
      nonWorkingDayName: null,
      isWithinOneHourOfMeetingWith: null,
      overlapsWithMeetingWith: {
        isCurrentUser: false,
        appointmentIsWith: { forename: 'Test', surname: 'User' },
        startAndEnd: '11am to 12pm',
      },
    }
    spy = jest
      .spyOn(MasApiClient.prototype, 'checkAppointments')
      .mockImplementation(() => Promise.resolve(mockAppointmentChecks))
    await checkAppointments(hmppsAuthClient)(req, res, nextSpy)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should show errors', () => {
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })
  it('should not call next()', () => {
    expect(nextSpy).toHaveBeenCalledTimes(0)
  })
})
describe('if appointment overlaps', () => {
  const mockAppointmentChecks: AppointmentChecks = {
    nonWorkingDayName: null,
    isWithinOneHourOfMeetingWith: null,
    overlapsWithMeetingWith: {
      isCurrentUser: false,
      appointmentIsWith: { forename: 'Test', surname: 'User' },
      startAndEnd: '11am to 12pm',
    },
  }
  beforeEach(async () => {
    spy = jest
      .spyOn(MasApiClient.prototype, 'checkAppointments')
      .mockImplementationOnce(() => Promise.resolve(mockAppointmentChecks))
    await checkAppointments(hmppsAuthClient)(req, res, nextSpy)
  })
  it('should shows warning', () => {
    expect(res.locals.warningMessages.overlapsWithMeetingWith).toEqual(
      'Test has an existing appointment at 11am to 12pm that overlaps with this time. Continue with these details or make changes',
    )
  })
})
