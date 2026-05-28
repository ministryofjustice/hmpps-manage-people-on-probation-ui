import httpMocks from 'node-mocks-http'
import { redirectWizard } from './redirectWizard'
import { AppointmentSession, EnforcementActionPage, OutcomePage } from '../models/Appointments'
import { AppResponse } from '../models/Locals'
import { CheckinUserDetails } from '../models/ESupervision'

const crn = 'X000001'
const uuid = '4715aa09-0f9d-4c18-948b-a42c45bc0974'
const contactId = '12345'

const mockAppointment: Partial<AppointmentSession> = {
  user: {
    username: 'user-1',
    teamCode: 'mock-team-code',
    locationCode: 'mock-location-code',
  },
  type: 'C084',
  date: '2044-12-22T09:15:00.382936Z[Europe/London]',
  start: '2044-12-22T09:15:00.382936Z[Europe/London]',
  end: '2044-12-22T09:15:00.382936Z[Europe/London]',
}

const mockCheckins: Partial<CheckinUserDetails> = {
  uuid: '12345',
  date: '2026-05-13',
  interval: 'WEEKLY',
}

interface Params {
  crn: string
  id?: string
  contactId?: string
}

const buildRequest = ({
  appointment = mockAppointment,
  checkins = mockCheckins,
  journey = 'ARRANGE',
}: {
  appointment?: Partial<AppointmentSession>
  checkins?: Partial<CheckinUserDetails>
  journey?: 'ARRANGE' | 'MANAGE'
} = {}): httpMocks.MockRequest<any> => {
  let id = uuid
  let params: Params = { crn, id: uuid, contactId: undefined }
  if (journey === 'MANAGE') {
    id = contactId
    params = { crn, id: undefined, contactId }
  }
  const req = {
    params,
    session: {
      data: {
        appointments: {
          [crn]: {
            [id]: appointment,
          },
        },
        esupervision: {
          [crn]: {
            [id]: {
              checkins,
            },
          },
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

const res = {
  locals: {
    user: {
      username: 'user-1',
    },
  },
  redirect: jest.fn().mockReturnThis(),
  render: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  status: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const redirectSpy = jest.spyOn(res, 'redirect')
const statusSpy = jest.spyOn(res, 'status')
const sendSpy = jest.spyOn(res, 'send')
const nextSpy = jest.fn()

describe('/middleware/redirectWizard - appointments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('No value paths in arguments', () => {
    it('should return a 400 status and send an error message', () => {
      const req = buildRequest()
      redirectWizard()(req, res, nextSpy)
      expect(statusSpy).toHaveBeenCalledWith(400)
      expect(sendSpy).toHaveBeenCalledWith('Redirect wizard - No paths defined')
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })

  describe('location is required, but it is undefined in the session appointment', () => {
    const appointment: Partial<AppointmentSession> = {
      ...mockAppointment,
      user: { ...mockAppointment.user, locationCode: undefined },
    }
    const req = buildRequest({ appointment })
    beforeEach(() => {
      redirectWizard([{ path: ['user', 'locationCode'] }])(req, res, nextSpy)
    })
    it('should redirect to the first page of the arrange appointment wizard', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
  describe('type and location are required, but location is undefined in the session appointment', () => {
    const appointment: Partial<AppointmentSession> = {
      ...mockAppointment,
      user: { ...mockAppointment.user, locationCode: undefined },
    }
    const req = buildRequest({ appointment })
    beforeEach(() => {
      redirectWizard([{ path: 'type' }, { path: ['user', 'locationCode'] }])(req, res, nextSpy)
    })
    it('should redirect to the first page of the arrange appointment wizard', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
  describe('type is required, and it is available in the session appointment', () => {
    const req = buildRequest()
    beforeEach(() => {
      redirectWizard([{ path: 'type' }])(req, res, nextSpy)
    })
    it('should not redirect to the first page of the arrange appointment wizard', () => {
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
})

describe('/middleware/redirectWizard - manage appointment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const enforcementActionPaths: ['outcome', EnforcementActionPage | OutcomePage][] = [
    ['outcome', 'attendedFailedToComply'],
    ['outcome', 'acceptableAbsence'],
    ['outcome', 'unacceptableAbsence'],
    ['outcome', 'failedToAttend'],
  ]

  describe('outcome type is required but is undefined in the appointment session', () => {
    const req = buildRequest({ journey: 'MANAGE' })
    beforeEach(() => {
      redirectWizard([{ path: ['outcome', 'outcomeType'] }])(req, res, nextSpy)
    })
    it('should redirect to the manage appointment page', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${contactId}/manage`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
  describe('outcome type is required and is defined in the appointment session', () => {
    const appointment: Partial<AppointmentSession> = {
      ...mockAppointment,
      outcome: {
        outcomeType: 'ATTENDED_COMPLIED',
      },
    }
    const req = buildRequest({ journey: 'MANAGE', appointment })
    beforeEach(() => {
      redirectWizard([{ path: ['outcome', 'outcomeType'] }])(req, res, nextSpy)
    })
    it('should not redirect', () => {
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe('outcome type value is required as ACCEPTABLE_ABSENCE but is a different value in the appointment session', () => {
    const appointment: Partial<AppointmentSession> = {
      ...mockAppointment,
      outcome: {
        outcomeType: 'UNACCEPTABLE_ABSENCE',
      },
    }
    const req = buildRequest({ journey: 'MANAGE', appointment })
    beforeEach(() => {
      redirectWizard([{ path: ['outcome', 'outcomeType'], value: 'ACCEPTABLE_ABSENCE' }])(req, res, nextSpy)
    })
    it('should redirect to the manage appointment page', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${contactId}/manage`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
  describe('enforcement action is required and is SEND_LETTER but is undefined appointment session', () => {
    const appointment: Partial<AppointmentSession> = {
      ...mockAppointment,
      outcome: {
        outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
        attendedFailedToComply: undefined,
      },
    }
    const req = buildRequest({ journey: 'MANAGE', appointment })

    beforeEach(() => {
      redirectWizard([{ path: ['outcome', 'outcomeType'] }, { path: enforcementActionPaths, value: ['SEND_LETTER'] }])(
        req,
        res,
        nextSpy,
      )
    })
    it('should redirect to the manage appointment page', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${contactId}/manage`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
  describe('outcome type value is required as UNACCEPTABLE_ABSENCE, enforcement action is required as NO_FURTHER_ACTION or SEND_LETTER but is different value in appointment session', () => {
    const appointment: Partial<AppointmentSession> = {
      ...mockAppointment,
      outcome: {
        outcomeType: 'UNACCEPTABLE_ABSENCE',
        unacceptableAbsence: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER',
      },
    }
    const req = buildRequest({ journey: 'MANAGE', appointment })

    beforeEach(() => {
      redirectWizard([
        { path: ['outcome', 'outcomeType'], value: 'UNACCEPTABLE_ABSENCE' },
        { path: enforcementActionPaths, value: ['NO_FURTHER_ACTION', 'SEND_LETTER'] },
      ])(req, res, nextSpy)
    })
    it('should redirect to the manage appointment page', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/appointment/${contactId}/manage`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })
  describe('enforcement action is required and is BREACH_RECALL_INITIATED and is defined in the appointment session', () => {
    const appointment: Partial<AppointmentSession> = {
      ...mockAppointment,
      outcome: {
        outcomeType: 'ATTENDED_FAILED_TO_COMPLY',
        attendedFailedToComply: 'BREACH_RECALL_INITIATED',
      },
    }
    const req = buildRequest({ journey: 'MANAGE', appointment })

    beforeEach(() => {
      redirectWizard([
        { path: ['outcome', 'outcomeType'] },
        { path: enforcementActionPaths, value: ['BREACH_RECALL_INITIATED'] },
      ])(req, res, nextSpy)
    })
    it('should not redirect', () => {
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
})

describe('/middleware/redirectWizard - setupcheckins', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('date is required, but it is undefined in the session appointment', () => {
    const checkins: Partial<CheckinUserDetails> = { ...mockCheckins, date: undefined }
    const req = buildRequest({ checkins })
    beforeEach(() => {
      redirectWizard([{ path: 'interval' }, { path: 'date' }], 'setupcheckins')(req, res, nextSpy)
    })
    it('should redirect to the first page of the setup wizard', () => {
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/appointments/${uuid}/check-in/eligibility-check`)
    })
    it('should not call next()', () => {
      expect(nextSpy).not.toHaveBeenCalled()
    })
  })

  describe('id is required, and it is available in the session', () => {
    const req = buildRequest()
    beforeEach(() => {
      redirectWizard([{ path: 'uuid' }], 'setupcheckins')(req, res, nextSpy)
    })
    it('should not redirect to the first page of the setup wizard', () => {
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should call next()', () => {
      expect(nextSpy).toHaveBeenCalled()
    })
  })
})
