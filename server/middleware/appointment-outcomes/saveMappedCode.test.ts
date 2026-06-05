import httpMocks from 'node-mocks-http'
import { saveMappedCode } from './saveMappedCode'
import { mockAppResponse } from '../../controllers/mocks'
import {
  AcceptableAbsenceOutcomeType,
  AppointmentEnforcementAction,
  AppointmentOutcomeType,
  AppointmentSessionOutcome,
} from '../../models/Appointments'
import { EnforcementActionCode } from '../../properties/appointment-outcomes'
import { setDataValue } from '../../utils'

jest.mock('../../utils', () => {
  const actualUtils = jest.requireActual('../../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
  }
})

const mockSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>

const crn = 'X000001'
const id = '12345'

const buildRequest = ({
  outcomeType = 'ACCEPTABLE_ABSENCE',
  pages = {},
}: {
  outcomeType?: AppointmentOutcomeType
  pages?: { [K in keyof AppointmentSessionOutcome]: AppointmentEnforcementAction | AcceptableAbsenceOutcomeType }
} = {}): httpMocks.MockRequest<any> => {
  const body = {
    appointments: {
      [crn]: {
        [id]: {
          outcome: {
            outcomeType,
            ...pages,
          },
        },
      },
    },
  }
  const session = {
    data: {
      appointments: {
        [crn]: {
          [id]: {
            outcome: {},
          },
        },
      },
    },
  }
  return httpMocks.createRequest({ body, session })
}

const buildResponse = ({
  reqUrl = '/outcome/add-note',
  enforcementActionCode = undefined,
}: { reqUrl?: string; enforcementActionCode?: EnforcementActionCode[] } = {}) => {
  const locals = {
    appointmentOutcome: {
      crn,
      id,
      appointmentSession: {
        outcome: {
          enforcementActionCode,
        },
      },
      reqUrl,
    },
  }
  return mockAppResponse(locals)
}

const nextSpy = jest.fn()

describe('middleware/appointment-outcomes/saveMappedCode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('Save mapped code for OUTCOME', () => {
    it('should only call next() if add note page', () => {
      const req = buildRequest({ outcomeType: 'WILL_BE_RESCHEDULED' })
      const res = buildResponse()
      saveMappedCode('OUTCOME')(req, res, nextSpy)
      expect(mockSetDataValue).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
    it('should not save the outcome code if selected option is not a map key', () => {
      const req = buildRequest({ outcomeType: 'WILL_BE_RESCHEDULED' })
      const res = buildResponse({ reqUrl: '/outcome' })
      saveMappedCode('OUTCOME')(req, res, nextSpy)
      expect(mockSetDataValue).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
    it('should save the outcome code if selected option is map key', () => {
      const req = buildRequest({ outcomeType: 'ATTENDED_FAILED_TO_COMPLY' })
      const res = buildResponse({ reqUrl: '/outcome' })
      saveMappedCode('OUTCOME')(req, res, nextSpy)
      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['appointments', crn, id, 'outcome', 'outcomeCode'],
        'AFTC',
      )
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe('Save mapped code for ACCEPTABLE_ABSENCE_OUTCOME', () => {
    it('should save the acceptable absence outcome code if selected option is map key', () => {
      const req = buildRequest({ pages: { acceptableAbsence: 'ACCEPTABLE_ABSENCE_HOLIDAY' } })
      const res = buildResponse({ reqUrl: '/outcome/acceptable-absence' })
      saveMappedCode('ACCEPTABLE_ABSENCE_OUTCOME')(req, res, nextSpy)
      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['appointments', crn, id, 'outcome', 'outcomeCode'],
        'AAHO',
      )
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Save mapped code for ACTION', () => {
    it('should not save the action code if selected option is not a map key', () => {
      const req = buildRequest({ pages: { failedToAttend: 'SEND_LETTER' } })
      const res = buildResponse({ reqUrl: '/outcome/failed-to-attend' })
      saveMappedCode('ACTION')(req, res, nextSpy)
      expect(mockSetDataValue).not.toHaveBeenCalled()
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
    it('should save the action code as new array if selected option is map key', () => {
      const req = buildRequest({
        pages: { unacceptableAbsence: 'BREACH_RECALL_INITIATED_AND_SEND_LETTER' },
      })
      const res = buildResponse({ reqUrl: '/outcome/unacceptable-absence' })
      saveMappedCode('ACTION')(req, res, nextSpy)
      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['appointments', crn, id, 'outcome', 'enforcementActionCode'],
        ['IBR'],
      )
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
    it('should append the action code to the array if selected option is map key and action session exists', () => {
      const req = buildRequest({
        pages: { letterType: 'LICENCE_COMPLIANCE_LETTER_SENT' },
      })
      const res = buildResponse({ enforcementActionCode: ['IBR'], reqUrl: '/outcome/initiate-breach-or-recall' })
      saveMappedCode('ACTION')(req, res, nextSpy)
      expect(mockSetDataValue).toHaveBeenCalledWith(
        req.session.data,
        ['appointments', crn, id, 'outcome', 'enforcementActionCode'],
        ['IBR', 'LCL'],
      )
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
})
