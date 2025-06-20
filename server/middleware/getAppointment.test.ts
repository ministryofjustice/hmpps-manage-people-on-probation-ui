import httpMocks from 'node-mocks-http'
import { getAppointment } from './getAppointment'
import { AppResponse } from '../models/Locals'
import HmppsAuthClient from '../data/hmppsAuthClient'

const mockAppt = {
  type: 'Phone call',
  location: '',
  date: '2044-12-22T09:15:00.382936Z[Europe/London]',
  start: '2044-12-22T09:15:00.382936Z[Europe/London]',
  end: '2044-12-22T09:15:00.382936Z[Europe/London]',
  repeating: 'Yes',
  interval: '',
  numberOfAppointments: '',
  id: 1,
}

jest.mock('../data/hmppsAuthClient')

const nextSpy = jest.fn()
const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>

xdescribe('/middleware/getAppointment', () => {
  it('should assign appointment to locals var if found in session', () => {
    const req = httpMocks.createRequest({
      params: {
        crn: 'X000001',
        id: 100,
      },
      session: {
        data: {
          appointments: {
            X000001: {
              100: mockAppt,
            },
          },
        },
      },
    })
    const res = {
      locals: {
        user: {
          username: 'user-1',
        },
      },
      redirect: jest.fn().mockReturnThis(),
    } as unknown as AppResponse
    getAppointment(hmppsAuthClient)(req, res, nextSpy)
    expect(res.locals.appointment).toEqual(req.session.data.appointments.X000001['100'])
    expect(nextSpy).toHaveBeenCalled()
  })

  it('should not set the locals var if appointment not found in session', () => {
    const req = httpMocks.createRequest({
      params: {
        crn: 'X000002',
        id: 100,
      },
      session: {
        data: {
          appointments: {
            X000001: {
              100: mockAppt,
            },
          },
        },
      },
    })
    const res = {
      locals: {
        user: {
          username: 'user-1',
        },
      },
      redirect: jest.fn().mockReturnThis(),
    } as unknown as AppResponse
    getAppointment(hmppsAuthClient)(req, res, nextSpy)
    expect(res.locals.appointment).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })
})
