import httpMocks from 'node-mocks-http'
import validation from '.'
import { mockAppResponse } from '../../controllers/mocks'
import { appointmentDateIsInPast } from '../appointmentDateIsInPast'

const crn = 'X000001'
const contactId = '1'
const arrangeAppointmentUrl = `case/${crn}/arrange-appointment/${contactId}`
const sentenceUrl = `${arrangeAppointmentUrl}/sentence`
const typeUrl = `${arrangeAppointmentUrl}/type`
const locationDateTimeUrl = `${arrangeAppointmentUrl}/location-date-time`
const supportingUrl = `${arrangeAppointmentUrl}/supporting-information`

jest.mock('../appointmentDateIsInPast', () => ({
  appointmentDateIsInPast: jest.fn(),
}))

const mockedAppointmentDateIsInPast = appointmentDateIsInPast as jest.MockedFunction<typeof appointmentDateIsInPast>

mockedAppointmentDateIsInPast.mockReturnValue(false)

const reqBase = {
  method: 'POST',
  params: {
    crn,
    id: contactId,
    contactId,
  },
  query: {},
  session: {},
  body: {},
}

describe('/controllers/arrangeAppointmentController', () => {
  let next: jest.Mock
  let makeRes: () => any

  beforeEach(() => {
    jest.clearAllMocks()

    next = jest.fn()

    makeRes = () =>
      mockAppResponse({
        filters: {
          dateFrom: '',
          dateTo: '',
          keywords: '',
        },
        flags: {
          enablePastAppointments: true,
        },
      })
  })

  const makeReq = (overrides: Record<string, unknown> = {}) =>
    httpMocks.createRequest(
      JSON.parse(
        JSON.stringify({
          ...reqBase,
          ...overrides,
        }),
      ),
    )

  it('validation passes as no url', () => {
    const req = makeReq()
    const res = makeRes()

    validation.appointments(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('validation passes for sentence', () => {
    const appointments = {
      [crn]: {
        [contactId]: { eventId: 1 },
      },
    }

    const req = makeReq({
      url: sentenceUrl,
      session: { data: { appointments } },
      body: { appointments },
    })
    const res = makeRes()

    validation.appointments(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('validation fails if no sentence selected', () => {
    const req = makeReq({
      url: sentenceUrl,
      session: { data: {} },
      body: { appointments: {} },
    })
    const res = makeRes()

    validation.appointments(req, res, next)

    expect(res.render).toHaveBeenCalled()
  })

  it('validation passes for type', () => {
    const appointments = {
      [crn]: {
        [contactId]: { type: 1 },
      },
    }

    const req = makeReq({
      url: typeUrl,
      session: { data: { appointments } },
      body: { appointments },
    })
    const res = makeRes()

    validation.appointments(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('validation fails for type', () => {
    const req = makeReq({
      url: typeUrl,
      session: { data: {} },
      body: { appointments: {} },
    })
    const res = makeRes()

    validation.appointments(req, res, next)

    expect(res.render).toHaveBeenCalled()
  })

  it('validation passes for location-date-time', () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          user: { locationCode: 'code' },
          date: '17/5/2030',
          start: '09:15',
          end: '10:15',
        },
      },
    }

    const req = makeReq({
      url: locationDateTimeUrl,
      session: { data: { appointments } },
      body: { appointments },
    })
    const res = makeRes()

    validation.appointments(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('validation fails for location-date-time - unselected fields', () => {
    const req = makeReq({
      url: locationDateTimeUrl,
      session: { data: {} },
      body: { appointments: {} },
    })
    const res = makeRes()

    validation.appointments(req, res, next)

    expect(res.render).toHaveBeenCalled()
  })

  it('validation fails for location-date-time - end before start', () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          user: { locationCode: 'code' },
          date: '2030-17-05',
          start: '10:15am',
          end: '9:15am',
        },
      },
    }

    const req = makeReq({
      url: locationDateTimeUrl,
      session: { data: { appointments } },
      body: { appointments },
    })
    const res = makeRes()

    validation.appointments(req, res, next)

    expect(res.render).toHaveBeenCalled()
  })

  it('validation passes for supporting information', () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          sensitivity: 'Yes',
          notes: '',
        },
      },
    }

    const req = makeReq({
      url: supportingUrl,
      session: { data: { appointments } },
      body: { appointments },
    })
    const res = makeRes()

    validation.appointments(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('validation fails for supporting information - no sensitivity', () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          notes: '',
        },
      },
    }

    const req = makeReq({
      url: supportingUrl,
      session: { data: { appointments } },
      body: { appointments },
    })
    const res = makeRes()

    validation.appointments(req, res, next)

    expect(res.render).toHaveBeenCalled()
  })

  it('validation fails for supporting information - notes too long', () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          sensitivity: 'Yes',
          notes: 'A'.repeat(100000),
        },
      },
    }

    const req = makeReq({
      url: supportingUrl,
      session: { data: { appointments } },
      body: { appointments },
    })
    const res = makeRes()

    validation.appointments(req, res, next)

    expect(res.render).toHaveBeenCalled()
  })
})
