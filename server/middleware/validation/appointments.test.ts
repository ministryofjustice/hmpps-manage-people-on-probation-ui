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
    const reqBaseType = {
      ...reqBase,
      url: sentenceUrl,
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
  it('validation passes for person level sentence', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'eventId'], 'PERSON_LEVEL_CONTACT')
    const reqBaseType = {
      ...reqBase,
      url: sentenceUrl,
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
  it('validation fails if no sentence selected', async () => {
    const data = {} as Data
    setDataValue(data, ['appointments', crn, contactId, 'eventId'], '')
    const reqBaseType = {
      ...reqBase,
      url: sentenceUrl,
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
