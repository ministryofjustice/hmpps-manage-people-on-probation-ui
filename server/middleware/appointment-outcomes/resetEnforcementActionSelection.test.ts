import httpMocks from 'node-mocks-http'
import { resetEnforcementActionSelection } from './resetEnforcementActionSelection'
import { setDataValue } from '../../utils'
import { AppointmentEnforcementAction, AppointmentSessionOutcome } from '../../models/Appointments'

const crn = 'X000001'
const id = '12345'

const baseOutcomeUrl = `/case/${crn}/appointments/appointment/${id}/outcome`

const mockOutcome: AppointmentSessionOutcome = {
  attendedFailedToComply: 'NO_FURTHER_ACTION',
  acceptableAbsence: 'ACCEPTABLE_ABSENCE_HOLIDAY',
  unacceptableAbsence: 'NO_FURTHER_ACTION',
  failedToAttend: 'NO_FURTHER_ACTION',
  otherEnforcementAction: 'NO_FURTHER_ACTION',
  breachNSICreatedBy: 'USER',
  letterType: 'FIRST_WARNING_LETTER_SENT',
  letterSentBy: 'USER',
  updateEnforcementAction: 'NO_FURTHER_ACTION',
}

jest.mock('../../utils', () => {
  const actualUtils = jest.requireActual('../../utils')
  return {
    ...actualUtils,
    setDataValue: jest.fn(),
  }
})

const setDataValueSpy = setDataValue as jest.MockedFunction<typeof setDataValue>
const nextSpy = jest.fn()

const checkReset = (req: httpMocks.MockRequest<any>) => {
  expect(setDataValueSpy).toHaveBeenNthCalledWith(
    1,
    req.session.data,
    ['appointments', crn, id, 'outcome', 'enforcementActionCode'],
    [],
  )
  expect(req.session.data.appointments[crn][id].outcome.attendedFailedToComply).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.acceptableAbsence).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.unacceptableAbsence).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.failedToAttend).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.otherEnforcementAction).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.breachNSICreatedBy).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.letterType).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.letterSentBy).toBeUndefined()
  expect(req.session.data.appointments[crn][id].outcome.updateEnforcementAction).toBeUndefined()
}

const buildRequest = ({ outcome = {} }: { outcome?: AppointmentSessionOutcome }): httpMocks.MockRequest<any> => {
  const req = {
    session: {
      data: {
        appointments: {
          [crn]: {
            [id]: {
              outcome,
            },
          },
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

const buildResponse = ({
  sendBreachOrRecallLetter = false,
  otherEnforcementAction = undefined as AppointmentEnforcementAction,
  reqUrl = `/case/${crn}/appointment/appointment/${id}/failed-to-attend`,
} = {}): httpMocks.MockResponse<any> => {
  const res = {
    locals: {
      appointmentOutcome: {
        crn,
        id,
        sendBreachOrRecallLetter,
        otherEnforcementAction,
        reqUrl,
        baseOutcomeUrl,
      },
    },
  }
  return httpMocks.createResponse(res)
}

xdescribe('middleware/resetEnforcementActionSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should return next() if action is initiate breach and send letter and current page is initiate breach or recall', () => {
    const req = httpMocks.createRequest({ session: {} })
    const res = buildResponse({ sendBreachOrRecallLetter: true, reqUrl: '/outcome/initiate-breach-or-recall' })
    resetEnforcementActionSelection(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(setDataValueSpy).not.toHaveBeenCalled()
  })

  it('should return next() if other action is selected and current page is update enforcement action', () => {
    const req = httpMocks.createRequest({ session: {} })
    const res = buildResponse({
      otherEnforcementAction: 'NO_FURTHER_ACTION',
      reqUrl: '/outcome/update-enforcement-action',
    })
    resetEnforcementActionSelection(req, res, nextSpy)
    expect(nextSpy).toHaveBeenCalledTimes(1)
    expect(setDataValueSpy).not.toHaveBeenCalled()
  })

  it('should reset the selected actions if current page is outcome', () => {
    const req = buildRequest({ outcome: mockOutcome })
    const res = buildResponse({
      reqUrl: baseOutcomeUrl,
    })
    resetEnforcementActionSelection(req, res, nextSpy)
    checkReset(req)
  })

  const enforcementActionPages = [
    baseOutcomeUrl,
    `${baseOutcomeUrl}/attended-failed-to-comply`,
    `${baseOutcomeUrl}/acceptable-absence`,
    `${baseOutcomeUrl}/unacceptable-absence`,
    `${baseOutcomeUrl}/failed-to-attend`,
    `${baseOutcomeUrl}/enforcement-action`,
    `${baseOutcomeUrl}/update-enforcement-action`,
  ]

  enforcementActionPages.forEach(page => {
    it(`should reset the selected actions if current page is ${page}`, () => {
      const req = buildRequest({ outcome: mockOutcome })
      const res = buildResponse({
        reqUrl: page,
      })
      resetEnforcementActionSelection(req, res, nextSpy)
      checkReset(req)
    })
  })
})
