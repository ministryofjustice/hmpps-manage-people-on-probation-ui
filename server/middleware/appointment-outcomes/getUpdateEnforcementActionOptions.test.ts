import httpMocks from 'node-mocks-http'
import { mockAppResponse } from '../../controllers/mocks'
import { getUpdateEnforcementActionOptions } from './getUpdateEnforcementActionOptions'
import { AppointmentEnforcementAction } from '../../models/Appointments'

const buildResponse = ({
  currentEnforcementAction = 'FIRST_WARNING_LETTER_SENT',
  acceptableAbsence = true,
}: {
  currentEnforcementAction?: AppointmentEnforcementAction
  acceptableAbsence?: boolean
} = {}): httpMocks.MockResponse<any> => {
  const locals = {
    appointmentOutcome: {
      forename: 'Alton',
      currentEnforcementAction,
      appointment: {
        acceptableAbsence,
      },
      sentence: {
        type: 'COMMUNITY',
      },
    },
  }
  return mockAppResponse(locals)
}

const nextSpy = jest.fn()
const req = httpMocks.createRequest()

describe('middleware/appointment-outcomes/getUpdateEnforcementActionOptions', () => {
  it('should define the correct options if enforcement action is a letter', () => {
    const res = buildResponse({ acceptableAbsence: false })
    getUpdateEnforcementActionOptions(req, res, nextSpy)
    expect(res.locals.appointmentOutcome.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'SEND_ANOTHER_LETTER' }),
        expect.objectContaining({ value: 'BREACH_RECALL_INITIATED' }),
        expect.objectContaining({ value: 'WITHDRAW_WARNING_LETTER' }),
        expect.objectContaining({ value: 'NO_FURTHER_ACTION' }),
        expect.objectContaining({ divider: 'or' }),
        expect.objectContaining({ value: 'DIFFERENT_ACTION' }),
      ]),
    )
    expect(res.locals.appointmentOutcome.options).toHaveLength(6)
    expect(nextSpy).toHaveBeenCalledTimes(1)
  })
  //   it('should define the correct options if enforcement action is a breach', () => {})
  //   it('should define the correct options if enforcement action is decision pending or refer to pp', () => {})
  //   it('should define the correct options if outcome is acceptable absence', () => {})
})
