import httpMocks from 'node-mocks-http'
import validation from '.'
import { mockAppResponse } from '../../controllers/mocks'

const crn = 'X000001'
const contactId = '1'
const arrangeAppointmentUrl = `case/${crn}/arrange-appointment/${contactId}`
const sentenceUrl = `${arrangeAppointmentUrl}/sentence`
const typeUrl = `${arrangeAppointmentUrl}/type`
const locationDateTimeUrl = `${arrangeAppointmentUrl}/location-date-time`
const repeatingUrl = `${arrangeAppointmentUrl}/repeating`
const supportingUrl = `${arrangeAppointmentUrl}/supporting-information`

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
} as object
const req = httpMocks.createRequest(reqBase)
const res = mockAppResponse({
  filters: {
    dateFrom: '',
    dateTo: '',
    keywords: '',
  },
})
const next = jest.fn()

describe('/controllers/arrangeAppointmentController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('validation passes as no url', async () => {
    validation.appointments(req, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation passes for sentence', async () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          eventId: 1,
        },
      },
    }
    const reqBaseSentence = {
      ...reqBase,
      url: sentenceUrl,
      session: {
        data: {
          appointments,
        },
      },
      body: {
        appointments,
      },
    } as unknown
    const reqSentence = httpMocks.createRequest(reqBaseSentence)
    validation.appointments(reqSentence, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation fails if no sentence selected', async () => {
    const reqBaseSentence = {
      ...reqBase,
      url: sentenceUrl,
      session: {
        data: {},
      },
      body: {
        appointments: {},
      },
    } as unknown
    const reqSentence = httpMocks.createRequest(reqBaseSentence)
    validation.appointments(reqSentence, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation passes for type', async () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          type: 1,
        },
      },
    }
    const reqBaseType = {
      ...reqBase,
      url: typeUrl,
      session: {
        data: {
          appointments,
        },
      },
      body: {
        appointments,
      },
    } as unknown
    const reqType = httpMocks.createRequest(reqBaseType)
    validation.appointments(reqType, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation fails for type', async () => {
    const reqBaseType = {
      ...reqBase,
      url: typeUrl,
      session: {
        data: {},
      },
      body: {
        appointments: {},
      },
    } as unknown
    const reqType = httpMocks.createRequest(reqBaseType)
    validation.appointments(reqType, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation passes for location-date-time', async () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          user: {
            locationCode: 'code',
          },
          date: '17/5/2030',
          start: '09:15',
          end: '10:15',
        },
      },
    }
    const reqBaseLocation = {
      ...reqBase,
      url: locationDateTimeUrl,
      session: {
        data: {
          appointments,
        },
      },
      body: {
        appointments,
      },
    } as unknown
    const reqLocation = httpMocks.createRequest(reqBaseLocation)
    validation.appointments(reqLocation, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation fails for location-date-time - unselected fields', async () => {
    const reqBaseLocation = {
      ...reqBase,
      url: locationDateTimeUrl,
      session: {
        data: {},
      },
      body: {
        appointments: {},
      },
    } as unknown
    const reqLocation = httpMocks.createRequest(reqBaseLocation)
    validation.appointments(reqLocation, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation fails for location-date-time - end before start', async () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          user: {
            locationCode: 'code',
          },
          date: '2030-17-05',
          start: '10:15am',
          end: '9:15am',
        },
      },
    }
    const reqBaseDate = {
      ...reqBase,
      url: locationDateTimeUrl,
      session: {
        data: {
          appointments,
        },
      },
      body: {
        appointments,
      },
    } as unknown
    const reqDate = httpMocks.createRequest(reqBaseDate)
    validation.appointments(reqDate, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation passes for repeating - not repeating', async () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          repeating: 'No',
        },
      },
    }
    const reqBaseLocation = {
      ...reqBase,
      url: repeatingUrl,
      session: {
        data: {
          appointments,
        },
      },
      body: {
        appointments,
      },
    } as unknown
    const reqLocation = httpMocks.createRequest(reqBaseLocation)
    validation.appointments(reqLocation, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation passes for repeating - repeating', async () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          repeating: 'Yes',
          interval: 'Monthly',
          numberOfRepeatAppointments: '2',
        },
      },
    }
    const reqBaseLocation = {
      ...reqBase,
      url: repeatingUrl,
      session: {
        data: {
          appointments,
        },
      },
      body: {
        appointments,
      },
    } as unknown
    const reqLocation = httpMocks.createRequest(reqBaseLocation)
    validation.appointments(reqLocation, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation fails for repeating - more than a year', async () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          repeating: 'Yes',
          interval: 'Monthly',
          numberOfRepeatAppointments: '2',
          date: '2030-10-02',
          repeatingDates: ['2040-10-02'],
        },
      },
    }
    const reqBaseLocation = {
      ...reqBase,
      url: repeatingUrl,
      session: {
        data: {
          appointments,
        },
      },
      body: {
        appointments,
      },
    } as unknown
    const reqLocation = httpMocks.createRequest(reqBaseLocation)
    validation.appointments(reqLocation, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation fails for repeating - no value', async () => {
    const reqBaseLocation = {
      ...reqBase,
      url: repeatingUrl,
      session: {
        data: {},
      },
      body: {
        appointments: {},
      },
    } as unknown
    const reqLocation = httpMocks.createRequest(reqBaseLocation)
    validation.appointments(reqLocation, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation passes for supporting information', async () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          sensitivity: 'Yes',
          notes: '',
        },
      },
    }
    const reqBaseType = {
      ...reqBase,
      url: supportingUrl,
      session: {
        data: {
          appointments,
        },
      },
      body: {
        appointments,
      },
    } as unknown
    const reqType = httpMocks.createRequest(reqBaseType)
    validation.appointments(reqType, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation fails for supporting information - no sensitivity', async () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          notes: '',
        },
      },
    }
    const reqBaseType = {
      ...reqBase,
      url: supportingUrl,
      session: {
        data: {
          appointments,
        },
      },
      body: {
        appointments,
      },
    } as unknown
    const reqType = httpMocks.createRequest(reqBaseType)
    validation.appointments(reqType, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation fails for supporting information - notes too long', async () => {
    const appointments = {
      [crn]: {
        [contactId]: {
          sensitivity: 'Yes',
          notes: 'A'.repeat(100000),
        },
      },
    }
    const reqBaseType = {
      ...reqBase,
      url: supportingUrl,
      session: {
        data: {
          appointments,
        },
      },
      body: {
        appointments,
      },
    } as unknown
    const reqType = httpMocks.createRequest(reqBaseType)
    validation.appointments(reqType, res, next)
    expect(res.render).toHaveBeenCalled()
  })
})
