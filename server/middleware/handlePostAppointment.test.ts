import httpMocks from 'node-mocks-http'
import { handlePostAppointment } from './handlePostAppointment'
import { mockAppResponse } from '../controllers/mocks'
import { isValidCrn, isValidUUID, setDataValue } from '../utils'
import { renderError } from './renderError'
import { HmppsAuthClient } from '../data'
import { AppointmentSession, AppointmentsPostResponse, RescheduleAppointmentResponse } from '../models/Appointments'
import { findUncompleted } from './findUncompleted'
import { postAppointments } from './postAppointments'
import { postRescheduleAppointments } from './postRescheduleAppointments'

const id = '304bddc2-cfa5-4a33-92e2-ee31fc93d627'
const contactId = '1234'
const rescheduleResponseContactId = 5678
const responseContactId = 4321
const crn = 'X000001'

const mockMiddlewareFn = jest.fn()

const mockPostAppointmentsResponse: AppointmentsPostResponse = {
  appointments: [
    {
      id: responseContactId,
    } as any,
  ],
}

const mockRescheduleResponse: RescheduleAppointmentResponse = {
  id: rescheduleResponseContactId,
  externalReference: 'mock-external-reference',
}

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidCrn: jest.fn(),
    isValidUUID: jest.fn(),
    setDataValue: jest.fn(),
  }
})

jest.mock('./findUncompleted', () => ({
  findUncompleted: jest.fn(() => jest.fn()),
}))

jest.mock('./postAppointments', () => ({
  postAppointments: jest.fn(() => jest.fn().mockResolvedValue(mockPostAppointmentsResponse)),
}))

jest.mock('./renderError', () => ({
  renderError: jest.fn(() => mockMiddlewareFn),
}))

jest.mock('./postRescheduleAppointments', () => ({
  postRescheduleAppointments: jest.fn(() => jest.fn().mockResolvedValue(mockRescheduleResponse)),
}))

const mockedIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockedIsValidUUID = isValidUUID as jest.MockedFunction<typeof isValidUUID>
const mockRenderError = renderError as jest.MockedFunction<typeof renderError>
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const setDataValueSpy = setDataValue as jest.MockedFunction<typeof setDataValue>
const findUncompletedSpy = findUncompleted as jest.MockedFunction<typeof findUncompleted>
const postAppointmentsSpy = postAppointments as jest.MockedFunction<typeof postAppointments>
const postRescheduleAppointmentsSpy = postRescheduleAppointments as jest.MockedFunction<
  typeof postRescheduleAppointments
>

const mockAppointment = (appointment: Partial<AppointmentSession> = {}): AppointmentSession => ({
  user: {
    username: 'user-1',
    teamCode: 'mock-team-code',
    locationCode: 'mock-location-code',
  },
  eventId: '1',
  type: 'C084',
  date: '2044-12-22T09:15:00.382936Z[Europe/London]',
  start: '2044-12-22T09:15:00.382936Z[Europe/London]',
  end: '2044-12-22T09:15:00.382936Z[Europe/London]',
  sensitivity: 'Yes',
  outcomeRecorded: 'Yes',
  smsOptIn: 'YES',
  sensitivityLocked: true,
  rescheduleAppointment: {},
  ...appointment,
})

const buildRequest = ({
  appointment,
}: { appointment?: Partial<AppointmentSession> } = {}): httpMocks.MockRequest<any> => {
  const req = {
    params: {
      crn,
      id,
      contactId,
    },
    session: {
      data: {
        appointments: {
          [crn]: {
            [id]: mockAppointment(appointment),
          },
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

const buildResponse = () => {
  const locals = {
    flags: {
      enableSensitivityRemoved: true,
    },
    appointmentOutcome: {},
  }
  return mockAppResponse(locals)
}

const res = buildResponse()
const nextSpy = jest.fn()

const redirectSpy = jest.spyOn(res, 'redirect')

describe('middleware/handlePostAppointment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should return a 400 error if invalid crn', async () => {
    const req = buildRequest()
    mockedIsValidCrn.mockReturnValue(false)
    mockedIsValidUUID.mockReturnValue(true)
    await handlePostAppointment(hmppsAuthClient)(req, res, nextSpy)
    expect(mockRenderError).toHaveBeenCalledWith(404)
    expect(nextSpy).not.toHaveBeenCalledTimes(1)
  })
  it('should return a 400 error if invalid UUID', async () => {
    const req = buildRequest()
    mockedIsValidCrn.mockReturnValue(true)
    mockedIsValidUUID.mockReturnValue(false)
    await handlePostAppointment(hmppsAuthClient)(req, res, nextSpy)
    expect(mockRenderError).toHaveBeenCalledWith(404)
    expect(nextSpy).not.toHaveBeenCalledTimes(1)
  })
  it(`should set sensitivity as 'Yes' if sensitivityLocked = true and enableSensitivityRemoved flag = true`, async () => {
    const req = buildRequest()
    mockedIsValidCrn.mockReturnValue(true)
    mockedIsValidUUID.mockReturnValue(true)
    findUncompletedSpy.mockReturnValueOnce(() => '/req/url')
    await handlePostAppointment(hmppsAuthClient)(req, res, nextSpy)
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      1,
      req.session.data,
      ['appointments', crn, id, 'sensitivity'],
      'Yes',
    )
  })
  it('should redirect to uncompleted page if there are uncompleted sections', async () => {
    const uncompletedUrl = `/case/${crn}/uncompleted-page?change=/path/to/change`
    const req = buildRequest()
    mockedIsValidCrn.mockReturnValue(true)
    mockedIsValidUUID.mockReturnValue(true)
    findUncompletedSpy.mockReturnValueOnce(() => uncompletedUrl)
    await handlePostAppointment(hmppsAuthClient)(req, res, nextSpy)
    expect(redirectSpy).toHaveBeenCalledWith(uncompletedUrl)
  })
  it('should post an appointment if there are no uncompleted sections and rescheduleAppointment.contactId does not exist', async () => {
    const req = buildRequest()
    mockedIsValidCrn.mockReturnValue(true)
    mockedIsValidUUID.mockReturnValue(true)
    await handlePostAppointment(hmppsAuthClient)(req, res, nextSpy)
    expect(postAppointmentsSpy).toHaveBeenCalled()
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      2,
      req.session.data,
      ['temp', crn, 'responseContactId'],
      String(responseContactId),
    )
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      3,
      req.session.data,
      ['appointments', crn, String(responseContactId)],
      mockAppointment(),
    )
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should post a reschedule appointment if rescheduleAppointment.contactId exists', async () => {
    const appointment: Partial<AppointmentSession> = { rescheduleAppointment: { contactId } }
    const req = buildRequest({ appointment })
    mockedIsValidCrn.mockReturnValue(true)
    mockedIsValidUUID.mockReturnValue(true)
    await handlePostAppointment(hmppsAuthClient)(req, res, nextSpy)
    expect(postRescheduleAppointmentsSpy).toHaveBeenCalledWith(hmppsAuthClient)
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      2,
      req.session.data,
      ['temp', crn, 'responseContactId'],
      String(rescheduleResponseContactId),
    )
    expect(setDataValueSpy).toHaveBeenNthCalledWith(
      3,
      req.session.data,
      ['appointments', crn, String(rescheduleResponseContactId)],
      mockAppointment(appointment),
    )
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
