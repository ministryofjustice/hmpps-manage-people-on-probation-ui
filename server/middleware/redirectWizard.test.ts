import httpMocks from 'node-mocks-http'
import { redirectWizard } from './redirectWizard'
import { Appointment, AppResponse } from '../@types'

const crn = 'X000001'
const id = '4715aa09-0f9d-4c18-948b-a42c45bc0974'

const mockAppointment: Appointment = {
  type: 'Phone call',
  location: '',
  date: '2044-12-22T09:15:00.382936Z[Europe/London]',
  'start-time': '2044-12-22T09:15:00.382936Z[Europe/London]',
  'end-time': '2044-12-22T09:15:00.382936Z[Europe/London]',
  repeating: 'Yes',
  'repeating-frequency': '',
  'repeating-count': '',
  id: '1',
}

const req = httpMocks.createRequest({
  params: {
    crn,
    id,
  },
  session: {
    data: {
      appointments: {
        [crn]: {
          [id]: mockAppointment,
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

const redirectSpy = jest.spyOn(res, 'redirect')
const nextSpy = jest.fn()

describe('/middleware/redirectWizard', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('location is required, but it is undefined in the session appointment', () => {
    const requiredValues = ['location']
    beforeEach(() => {
      redirectWizard(requiredValues)(req, res, nextSpy)
    })
    it('should redirect to the first page of the arrange appointment wizard', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${id}/type`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
  describe('type and location are required, but location is undefined in the session appointment', () => {
    const requiredValues = ['type', 'location']
    beforeEach(() => {
      redirectWizard(requiredValues)(req, res, nextSpy)
    })
    it('should redirect to the first page of the arrange appointment wizard', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${id}/type`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
  describe('type is required, and it is available in the session appointment', () => {
    const requiredValues = ['type']
    beforeEach(() => {
      redirectWizard(requiredValues)(req, res, nextSpy)
    })
    it('should not redirect to the first page of the arrange appointment wizard', () => {
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
})
