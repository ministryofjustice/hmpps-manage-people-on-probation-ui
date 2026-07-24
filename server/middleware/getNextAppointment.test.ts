import httpMocks from 'node-mocks-http'
import { MPoPComponents } from '@ministryofjustice/hmpps-mpop-frontend-components-lib'
import { getNextAppointment } from './getNextAppointment'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { AppResponse } from '../models/Locals'
import { PersonalDetailsSession } from '../models/Data'
import { NextAppointmentResponse } from '../models/SupervisionPackage'
import logger from '../../logger'

jest.mock('../../logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}))

const CRN = 'X000001'
const SYSTEM_TOKEN = 'mock-system-token'

const makeAppointment = (overrides: Partial<Record<string, any>> = {}) => ({
  id: 1,
  type: { code: 'APAT', description: 'Appointment' },
  ...overrides,
})

const makeNextAppointmentResponse = (overrides: Partial<NextAppointmentResponse> = {}): NextAppointmentResponse => ({
  httpStatus: 200,
  personSchedule: {
    personSummary: {
      name: { forename: 'John', surname: 'Smith' },
      crn: CRN,
      dateOfBirth: '1990-01-01',
    },
    personSchedule: {
      size: 1,
      page: 0,
      totalResults: 1,
      totalPages: 1,
      appointments: [makeAppointment()],
    },
  } as any,
  ...overrides,
})

const makeSessionEntry = (nextAppointmentResponse?: any): PersonalDetailsSession =>
  ({
    overview: {} as any,
    sentencePlan: {} as any,
    risks: {} as any,
    tierCalculation: {} as any,
    ...(nextAppointmentResponse !== undefined ? { nextAppointmentResponse } : {}),
  }) as PersonalDetailsSession

const buildReq = (sessionPersonalDetails: Record<string, any> = {}) =>
  httpMocks.createRequest({
    params: { crn: CRN },
    session: {
      data: {
        personalDetails: sessionPersonalDetails,
      },
    },
  })

const buildRes = (enableSupervisionPackage: boolean): AppResponse =>
  ({
    locals: {
      user: { username: 'user-1' },
      flags: { enableSupervisionPackage },
    },
  }) as unknown as AppResponse

describe('getNextAppointment middleware', () => {
  const ORIGINAL_ENV = process.env

  let mpopComponents: jest.Mocked<Pick<MPoPComponents, 'getPersonSchedule'>>
  let hmppsAuthClient: jest.Mocked<Pick<HmppsAuthClient, 'getSystemClientToken'>>
  let nextSpy: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'production' }
    nextSpy = jest.fn()
    mpopComponents = { getPersonSchedule: jest.fn() }
    hmppsAuthClient = { getSystemClientToken: jest.fn().mockResolvedValue(SYSTEM_TOKEN) }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('should call next() without fetching when enableSupervisionPackage flag is false', async () => {
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(false)

    await getNextAppointment(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(hmppsAuthClient.getSystemClientToken).not.toHaveBeenCalled()
    expect(mpopComponents.getPersonSchedule).not.toHaveBeenCalled()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should use cached nextAppointmentResponse when already present in session', async () => {
    const cached = makeNextAppointmentResponse()
    const req = buildReq({ [CRN]: makeSessionEntry(cached) })
    const res = buildRes(true)

    await getNextAppointment(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(mpopComponents.getPersonSchedule).not.toHaveBeenCalled()
    expect(res.locals.nextAppointmentDetails).toEqual(cached.personSchedule.personSchedule.appointments[0])
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should fetch and store nextAppointmentResponse in session when not cached', async () => {
    const appointmentResponse = makeNextAppointmentResponse()
    mpopComponents.getPersonSchedule.mockResolvedValue(appointmentResponse)
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getNextAppointment(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('user-1')
    expect(mpopComponents.getPersonSchedule).toHaveBeenCalledWith(SYSTEM_TOKEN, CRN)
    expect(req.session.data.personalDetails[CRN].nextAppointmentResponse).toEqual(appointmentResponse)
    expect(res.locals.nextAppointmentDetails).toEqual(appointmentResponse.personSchedule.personSchedule.appointments[0])
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should set nextAppointmentDetails to null when there are no appointments', async () => {
    const appointmentResponse = makeNextAppointmentResponse({
      personSchedule: {
        personSummary: {
          name: { forename: 'John', surname: 'Smith' },
          crn: CRN,
          dateOfBirth: '1990-01-01',
        },
        personSchedule: {
          size: 0,
          page: 0,
          totalResults: 0,
          totalPages: 0,
          appointments: [],
        },
      } as any,
    })
    mpopComponents.getPersonSchedule.mockResolvedValue(appointmentResponse)
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getNextAppointment(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(res.locals.nextAppointmentDetails).toBeNull()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should re-fetch nextAppointment in development mode even when cached', async () => {
    process.env.NODE_ENV = 'development'
    const cached = makeNextAppointmentResponse()
    const fresh = makeNextAppointmentResponse({
      personSchedule: {
        ...cached.personSchedule,
        personSchedule: {
          ...cached.personSchedule.personSchedule,
          appointments: [makeAppointment({ id: 2 })],
        },
      } as any,
    })
    mpopComponents.getPersonSchedule.mockResolvedValue(fresh)
    const req = buildReq({ [CRN]: makeSessionEntry(cached) })
    const res = buildRes(true)

    await getNextAppointment(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(mpopComponents.getPersonSchedule).toHaveBeenCalledTimes(1)
    expect(res.locals.nextAppointmentDetails).toEqual(fresh.personSchedule.personSchedule.appointments[0])
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should send error to the logger when the API returns a non-200 status', async () => {
    mpopComponents.getPersonSchedule.mockResolvedValue({ personSchedule: null, httpStatus: 500 })
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getNextAppointment(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: `Failed to fetch next appointment for CRN ${CRN}. HTTP status: 500`,
      }),
      'Failed to fetch next appointment from MPoP Components API.',
    )
    expect(res.locals.nextAppointmentDetails).toBeNull()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should send error to the logger when the API call throws an error', async () => {
    mpopComponents.getPersonSchedule.mockRejectedValue(new Error('Connection refused'))
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getNextAppointment(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Connection refused' }),
      'Failed to connect to MPoP Components API.',
    )
    expect(res.locals.nextAppointmentDetails).toBeNull()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should set nextAppointmentResponse to undefined when the API throws a non-Error object', async () => {
    mpopComponents.getPersonSchedule.mockRejectedValue('unexpected string error')
    const req = buildReq({ [CRN]: makeSessionEntry() })
    const res = buildRes(true)

    await getNextAppointment(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(res.locals.nextAppointmentDetails).toBeNull()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should initialise session personal details for CRN if not already present', async () => {
    const appointmentResponse = makeNextAppointmentResponse()
    mpopComponents.getPersonSchedule.mockResolvedValue(appointmentResponse)
    const req = buildReq({})
    const res = buildRes(true)

    await getNextAppointment(
      hmppsAuthClient as unknown as HmppsAuthClient,
      mpopComponents as unknown as MPoPComponents,
    )(req, res, nextSpy)

    expect(req.session.data.personalDetails[CRN]).toBeDefined()
    expect(req.session.data.personalDetails[CRN].nextAppointmentResponse).toEqual(appointmentResponse)
    expect(nextSpy).toHaveBeenCalled()
  })
})
