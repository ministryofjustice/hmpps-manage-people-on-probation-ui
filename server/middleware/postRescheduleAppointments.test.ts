import httpMocks from 'node-mocks-http'
import { DateTime } from 'luxon'
import MasApiClient from '../data/masApiClient'
import HmppsAuthClient from '../data/hmppsAuthClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import { postRescheduleAppointments } from './postRescheduleAppointments'
import { mockAppResponse, mockPersonAppointment } from '../controllers/mocks'
import { AppointmentSession, RescheduleAppointmentResponse } from '../models/Appointments'
import { PersonAppointment } from '../data/model/schedule'

const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const hmppsAuthClient = new HmppsAuthClient(tokenStore)

jest.mock('../data/masApiClient')
jest.mock('../data/SupervisionAppointmentClient')
jest.mock('../data/hmppsAuthClient')
jest.mock('../data/tokenStore/redisTokenStore')

const crn = 'X000001'
const uuid = '4715aa09-0f9d-4c18-948b-a42c45bc0974'
const contactId = '12345'
const username = 'user-1'
const now = DateTime.now()
const tomorrow = now.plus({ days: 1 }).toFormat('yyyy M d')
const mockRescheduleResponse: RescheduleAppointmentResponse = {
  id: 12345,
  externalReference: 'ABCDE',
}
const mockPatchResponse = mockPersonAppointment
const putRescheduleAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'putRescheduleAppointment')
  .mockImplementation(() => Promise.resolve(mockRescheduleResponse))
const patchAppointmentSpy = jest
  .spyOn(MasApiClient.prototype, 'patchAppointment')
  .mockImplementation(() => Promise.resolve(mockPatchResponse))

const mockAppointment: AppointmentSession = {
  user: {
    locationCode: 'HMP',
    teamCode: 'TEA',
    username,
  },
  type: 'COAP',
  date: tomorrow,
  start: '9:00am',
  end: '9:30pm',
  until: tomorrow,
  interval: 'DAY',
  numberOfAppointments: '1',
  eventId: '250113825',
  requirementId: '1',
  licenceConditionId: '2500686668',
  notes: 'Some notes',
  sensitivity: 'Yes',
  visorReport: 'No',
  rescheduleAppointment: {
    whoNeedsToReschedule: 'SERVICE',
  },
}

const buildRequest = (appointment?: Record<string, string>): [httpMocks.MockRequest<any>, AppointmentSession] => {
  const req = {
    params: {
      crn,
      id: uuid,
      contactId,
    },
    session: {
      data: {
        appointments: {
          [crn]: {
            [uuid]: { ...mockAppointment, ...(appointment || {}) },
          },
        },
      },
    },
  }
  return [httpMocks.createRequest(req), req.session.data.appointments[crn][uuid]]
}

describe('middleware/postRescheduleAppointments', () => {
  const res = mockAppResponse()
  xdescribe('reschedule an appointment in the future', () => {
    const [req, mockAppointmentSession] = buildRequest()
    const {
      date,
      start: startTime,
      end: endTime,
      user: { staffCode, teamCode, locationCode },
      notes,
      rescheduleAppointment: { whoNeedsToReschedule: requestedBy },
    } = mockAppointmentSession
    const expectedBody = {
      date,
      startTime,
      endTime,
      uuid,
      staffCode,
      teamCode,
      locationCode,
      requestedBy,
      notes,
      sensitive: true,
      sendToVisor: false,
    }
    let returnedResponse: RescheduleAppointmentResponse
    beforeEach(async () => {
      returnedResponse = (await postRescheduleAppointments(hmppsAuthClient)(req, res)) as RescheduleAppointmentResponse
    })
    it('should send a reschedule appointment request to the api', () => {
      expect(putRescheduleAppointmentSpy).toHaveBeenCalledWith(contactId, expectedBody)
    })
    it('should return the response', () => {
      expect(returnedResponse).toEqual(mockRescheduleResponse)
    })
  })
  xdescribe('reschedule an appointment in the past', () => {
    const [req, mockAppointmentSession] = buildRequest({ date: '2025-03-10', until: '2025-03-10' })
    let returnedResponse: PersonAppointment
    beforeEach(async () => {
      returnedResponse = (await postRescheduleAppointments(hmppsAuthClient)(req, res)) as PersonAppointment
    })
    it('should send a patch appointment request to the api', () => {
      const { notes, date, start: startTime } = mockAppointmentSession
      const expectedBody = {
        id: parseInt(contactId, 10),
        notes,
        sensitive: true,
        date,
        startTime,
      }
      expect(patchAppointmentSpy).toHaveBeenCalledWith(expectedBody)
    })
    it('should return the response', () => {
      expect(returnedResponse).toEqual(mockPatchResponse)
    })
  })
})
