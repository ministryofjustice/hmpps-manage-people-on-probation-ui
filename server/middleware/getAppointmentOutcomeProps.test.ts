import { DateTime } from 'luxon'
import httpMocks from 'node-mocks-http'
import { getAppointmentOutcomeProps } from './getAppointmentOutcomeProps'
import { mockAppResponse } from '../controllers/mocks'
import { appointmentDateIsInPast } from './appointmentDateIsInPast'
import { getDataValue } from '../utils'
import { Sentence } from '../data/model/sentenceDetails'

const contactId = '12345'
const crn = 'X000001'
const uuid = 'b5719245-0f0a-4bbc-bbef-2d6a095e39f7'
const forename = 'James'
const surname = 'Morrison'
const typeDescription = '3 Way Meeting (NS)'
const officerForename = 'John'
const officerSurname = 'Smith'
const pastDate = '2025-10-11'
const start = '09:00'
const end = '10:00'
const url = '/mock/url'
const nextSpy = jest.fn()

const mockSentences: Sentence[] = [
  {
    id: 49,
    eventNumber: '1234567',
    sentenceType: 'CUSTODY',
    order: {
      description: 'Pre-Sentence',
      startDate: '2025-05-31',
      endDate: '2025-05-31',
    },
    nsis: [],
    licenceConditions: [],
    requirements: [],
  },
  {
    id: 48,
    eventNumber: '7654321',
    sentenceType: 'COMMUNITY',
    order: {
      description: 'Pre-Sentence',
      startDate: '2025-05-31',
      endDate: '2025-05-31',
    },
    nsis: [],
    licenceConditions: [],
    requirements: [],
  },
]

const buildRequest = ({ params = {}, date = pastDate, id = uuid, type = 'COPT' } = {}): httpMocks.MockRequest<any> => {
  const req = {
    params: {
      contactId,
      crn,
      id,
      ...params,
    },
    url,
    session: {
      data: {
        appointments: {
          [crn]: {
            [id]: {
              date,
              start,
              end,
              type,
              eventId: '48',
            },
          },
        },
      },
    },
  }
  return httpMocks.createRequest(req)
}

const buildResponse = (date = pastDate, time = start): httpMocks.MockResponse<any> => {
  const locals = {
    case: {
      name: {
        forename,
        surname,
      },
    },
    personAppointment: {
      personSummary: {
        crn,
        name: {
          forename,
          surname,
        },
      },
      appointment: {
        type: typeDescription,
        officer: {
          name: {
            forename: officerForename,
            surname: officerSurname,
          },
        },
        startDateTime: `${date}T${time}:00Z`,
      },
    },
    appointment: {
      type: {
        description: typeDescription,
      },
      attending: {
        name: `${officerForename} ${officerSurname}`,
      },
    },
  }
  return mockAppResponse(locals)
}

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    getDataValue: jest.fn(),
  }
})

jest.mock('./appointmentDateIsInPast', () => ({
  appointmentDateIsInPast: jest.fn(),
}))

const mockAppointmentDateIsInPast = appointmentDateIsInPast as jest.MockedFunction<typeof appointmentDateIsInPast>
const mockGetDataValue = getDataValue as jest.MockedFunction<typeof getDataValue>

mockGetDataValue.mockReturnValue(mockSentences)

xdescribe('/middleware/getAppointmentOutcomeProps()', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('Arrange appointment journey', () => {
    it('should add the correct values to res.locals.appointmentOutcome', () => {
      const req = buildRequest({ params: { contactId: undefined } })
      const res = buildResponse()
      mockAppointmentDateIsInPast.mockReturnValueOnce(true)
      jest.spyOn(DateTime.prototype, 'toISO').mockImplementation(() => '2025-10-11T09:00:00Z')
      getAppointmentOutcomeProps(req, res, nextSpy)
      expect(res.locals.appointmentOutcome).toEqual(
        expect.objectContaining({
          forename,
          surname,
          appointment: res.locals.personAppointment.appointment,
          crn,
          uuid,
          contactId: undefined,
          id: uuid,
          isValidParams: true,
          isInPast: true,
          reqUrl: url,
          baseUrl: `/case/${crn}/arrange-appointment/${uuid}`,
          baseOutcomeUrl: `/case/${crn}/arrange-appointment/${uuid}/outcome`,
          completedUrl: `/case/${crn}/arrange-appointment/${uuid}/check-your-answers`,
          appointmentSession: req.session.data.appointments[crn][uuid],
          sentenceType: 'COMMUNITY',
        }),
      )
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
  describe('Manage appointment journey', () => {
    it('should add the correct values to res.locals.appointmentOutcome', () => {
      const req = buildRequest({ id: contactId, params: { id: undefined } })
      const res = buildResponse()
      mockAppointmentDateIsInPast.mockReturnValueOnce(false)
      jest.spyOn(DateTime.prototype, 'toISO').mockImplementation(() => '2025-10-11T09:00:00Z')
      getAppointmentOutcomeProps(req, res, nextSpy)
      expect(res.locals.appointmentOutcome).toEqual(
        expect.objectContaining({
          forename,
          surname,
          appointment: res.locals.personAppointment.appointment,
          crn,
          uuid: undefined,
          contactId,
          id: contactId,
          isValidParams: true,
          isInPast: false,
          reqUrl: url,
          baseUrl: `/case/${crn}/appointments/appointment/${contactId}`,
          baseOutcomeUrl: `/case/${crn}/appointments/appointment/${contactId}/outcome`,
          completedUrl: `/case/${crn}/appointments/appointment/${contactId}/manage`,
          appointmentSession: req.session.data.appointments[crn][contactId],
          sentenceType: 'COMMUNITY',
        }),
      )
      expect(nextSpy).toHaveBeenCalledTimes(1)
    })
  })
})
