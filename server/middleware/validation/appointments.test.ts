import httpMocks from 'node-mocks-http'
import { RequestOptions } from 'https'
import validation from '.'
import { mockAppResponse } from '../../controllers/mocks'
import { setDataValue } from '../../utils'
import appointments from '../../../wiremock/stubs/appointments'
import { AppointmentSession } from '../../models/Appointments'
import { Data } from '../../models/Data'

const crn = 'X000001'
const contactId = '1'
const arrangeAppointmentUrl = `case/${{ crn }}/arrange-appointment/${{ contactId }}`
const sentenceUrl = `${{ arrangeAppointmentUrl }}/sentence`
const typeUrl = `${{ arrangeAppointmentUrl }}/type`
const locationUrl = `${{ arrangeAppointmentUrl }}/location`
const dateUrl = `${{ arrangeAppointmentUrl }}/date-time`
const repeatingUrl = `${{ arrangeAppointmentUrl }}/repeating`
const supportingUrl = `${{ arrangeAppointmentUrl }}/supporting-information`

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
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'eventId'], 1)
    const reqBaseSentence = {
      ...reqBase,
      url: sentenceUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqSentence = httpMocks.createRequest(reqBaseSentence)
    validation.appointments(reqSentence, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation fails if no sentence selected', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'eventId'], '')
    const reqBaseSentence = {
      ...reqBase,
      url: sentenceUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqSentence = httpMocks.createRequest(reqBaseSentence)
    validation.appointments(reqSentence, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation passes for type', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'type'], 1)
    const reqBaseType = {
      ...reqBase,
      url: typeUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqType = httpMocks.createRequest(reqBaseType)
    validation.appointments(reqType, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation fails for type', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'type'], '')
    const reqBaseType = {
      ...reqBase,
      url: typeUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqType = httpMocks.createRequest(reqBaseType)
    validation.appointments(reqType, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation passes for location', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'user', 'locationCode'], 'code')
    const reqBaseLocation = {
      ...reqBase,
      url: locationUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqLocation = httpMocks.createRequest(reqBaseLocation)
    validation.appointments(reqLocation, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation fails for location', async () => {
    const data = {} as Data
    const reqBaseLocation = {
      ...reqBase,
      url: locationUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqLocation = httpMocks.createRequest(reqBaseLocation)
    validation.appointments(reqLocation, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation passes for date', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'date'], '17/5/2030')
    setDataValue(data, ['appointments', crn, contactId, 'start'], '9:15am')
    setDataValue(data, ['appointments', crn, contactId, 'end'], '10:15am')
    const reqBaseDate = {
      ...reqBase,
      url: dateUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqDate = httpMocks.createRequest(reqBaseDate)
    validation.appointments(reqDate, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation fails for date - unselected fields', async () => {
    const data = {} as Data
    const reqBaseDate = {
      ...reqBase,
      url: dateUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqDate = httpMocks.createRequest(reqBaseDate)
    validation.appointments(reqDate, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation fails for date - end before start', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'date'], '2030-17-05')
    setDataValue(data, ['appointments', crn, contactId, 'end'], '9:15am')
    setDataValue(data, ['appointments', crn, contactId, 'start'], '10:15am')
    const reqBaseDate = {
      ...reqBase,
      url: dateUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqDate = httpMocks.createRequest(reqBaseDate)
    validation.appointments(reqDate, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation passes for repeating - not repeating', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'repeating'], 'No')
    const reqBaseLocation = {
      ...reqBase,
      url: repeatingUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqLocation = httpMocks.createRequest(reqBaseLocation)
    validation.appointments(reqLocation, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation passes for repeating - repeating', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'repeating'], 'Yes')
    setDataValue(data, ['appointments', crn, contactId, 'interval'], 'Monthly')
    setDataValue(data, ['appointments', crn, contactId, 'numberOfRepeatAppointments'], '2')
    const reqBaseLocation = {
      ...reqBase,
      url: repeatingUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqLocation = httpMocks.createRequest(reqBaseLocation)
    validation.appointments(reqLocation, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation fails for repeating - more than a year', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'repeating'], 'Yes')
    setDataValue(data, ['appointments', crn, contactId, 'interval'], 'Monthly')
    setDataValue(data, ['appointments', crn, contactId, 'numberOfRepeatAppointments'], '2')
    setDataValue(data, ['appointments', crn, contactId, 'date'], '2030-10-02')
    setDataValue(data, ['appointments', crn, contactId, 'repeatingDates'], ['2040-10-02'])
    const reqBaseLocation = {
      ...reqBase,
      url: repeatingUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqLocation = httpMocks.createRequest(reqBaseLocation)
    validation.appointments(reqLocation, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation fails for repeating - no value', async () => {
    const data = {} as Data
    const reqBaseLocation = {
      ...reqBase,
      url: repeatingUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqLocation = httpMocks.createRequest(reqBaseLocation)
    validation.appointments(reqLocation, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation passes for supporting information', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'sensitivity'], 'Yes')
    setDataValue(data, ['appointments', crn, contactId, 'notes'], '')
    const reqBaseType = {
      ...reqBase,
      url: supportingUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqType = httpMocks.createRequest(reqBaseType)
    validation.appointments(reqType, res, next)
    expect(next).toHaveBeenCalled()
  })
  it('validation fails for supporting information - no sensitivity', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'notes'], '')
    const reqBaseType = {
      ...reqBase,
      url: supportingUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqType = httpMocks.createRequest(reqBaseType)
    validation.appointments(reqType, res, next)
    expect(res.render).toHaveBeenCalled()
  })
  it('validation fails for supporting information - notes too long', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'sensitivity'], 'Yes')
    setDataValue(data, ['appointments', crn, contactId, 'notes'], 'A'.repeat(100000))
    const reqBaseType = {
      ...reqBase,
      url: supportingUrl,
      session: {
        data,
      },
      body: {
        appointments: data.appointments,
      },
    } as unknown
    const reqType = httpMocks.createRequest(reqBaseType)
    validation.appointments(reqType, res, next)
    expect(res.render).toHaveBeenCalled()
  })
})
