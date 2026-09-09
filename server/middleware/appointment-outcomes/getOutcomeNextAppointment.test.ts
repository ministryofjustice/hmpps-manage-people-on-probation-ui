import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { Activity } from '../../data/model/schedule'
import { AppointmentType } from '../../models/Appointments'
import { AppResponse } from '../../models/Locals'
import { getOutcomeNextAppointment } from './getOutcomeNextAppointment'

const crn = 'X000001'
const nextAppointmentId = '1234'

const appointmentTypes: AppointmentType[] = [
  {
    code: 'COAP',
    description: 'Planned Office Visit (NS)',
    isPersonLevelContact: false,
    isLocationRequired: true,
  },
  {
    code: 'COPT',
    description: 'Planned Telephone Contact (NS)',
    isPersonLevelContact: false,
    isLocationRequired: false,
  },
]

const nextAppointment: Activity = {
  id: '5678',
  type: 'Planned Telephone Contact (NS)',
  startDateTime: '2026-08-21T09:00:00',
  endDateTime: '2026-08-21T10:00:00',
}

const buildRequest = ({ id = null }: { id?: string | null } = {}): httpMocks.MockRequest<any> => {
  const req = {
    session: {
      data: {
        appointments: {
          [crn]: {
            [nextAppointmentId]: {
              date: '2026-08-01',
              start: '11:00',
              end: '11:30',
              type: 'COAP',
            },
          },
        },
        temp: {
          [crn]: {
            nextAppointmentId: id,
          },
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

const buildResponse = ({ enableCombinedCYAPage = true } = {}): AppResponse => {
  const locals = {
    flags: {
      enableCombinedCYAPage,
    },
    appointmentTypes,
    appointmentOutcome: { crn },
    nextAppointment: {
      appointment: nextAppointment,
    },
  }
  return mockAppResponse(locals)
}

const nextSpy = jest.fn()

describe('middleware/appointment-outcomes/getOutcomeNextAppointment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should set the correct next appointment if nextAppointmentId is not set', () => {
    const req = buildRequest()
    const res = buildResponse()
    getOutcomeNextAppointment(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.nextAppointment).toStrictEqual({
      id: '5678',
      label: 'Planned telephone contact (NS) on Friday 21 August 2026 at 9am to 10am',
    })
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the correct next appointment if nextAppointmentId is set', () => {
    const req = buildRequest({ id: nextAppointmentId })
    const res = buildResponse()
    getOutcomeNextAppointment(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.nextAppointment).toStrictEqual({
      id: nextAppointmentId,
      label: 'Planned office visit (NS) on Saturday 1 August 2026 at 11am to 11:30am',
    })
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  it('should set the next appointment to null if enableCombinedCYAPage is false', () => {
    const req = buildRequest()
    const res = buildResponse({ enableCombinedCYAPage: false })
    getOutcomeNextAppointment(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.nextAppointment).toBeUndefined()
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
})
