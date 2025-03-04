import httpMocks from 'node-mocks-http'
import { getAppointment } from './getAppointment'
import { AppResponse } from '../@types'

const mockAppt = {
  type: 'Phone call',
  location: '',
  date: '2044-12-22T09:15:00.382936Z[Europe/London]',
  'start-time': '2044-12-22T09:15:00.382936Z[Europe/London]',
  'end-time': '2044-12-22T09:15:00.382936Z[Europe/London]',
  repeating: 'Yes',
  'repeating-frequency': '',
  'repeating-count': '',
  id: 1,
}

const nextSpy = jest.fn()

describe('/middleware/getAppointment', () => {
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
    getAppointment(req, res, nextSpy)
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
    getAppointment(req, res, nextSpy)
    expect(res.locals.appointment).toBeUndefined()
    expect(nextSpy).toHaveBeenCalled()
  })
})
