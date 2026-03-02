import httpMocks, { RequestOptions } from 'node-mocks-http'
import validation from '.'
import { mockAppResponse } from '../../controllers/mocks'

const crn = 'X000001'
const url = `case/${crn}/add-contact`

const reqBase = {
  method: 'POST',
  url,
  params: { crn },
  query: {},
  session: {},
  body: {},
} as RequestOptions

const next = jest.fn()

describe('addContact validation', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call next when all required fields are valid', () => {
    const req = httpMocks.createRequest({
      ...reqBase,
      body: {
        sentence: '1',
        date: '17/5/2024',
        time: '09:30',
        visor: 'No',
        sensitivity: 'No',
      },
    })
    const res = mockAppResponse()

    validation.addContact(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.render).not.toHaveBeenCalled()
  })

  it('should render with errors when all required fields are empty', () => {
    const req = httpMocks.createRequest({
      ...reqBase,
      body: {},
    })
    const res = mockAppResponse()

    validation.addContact(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.render).toHaveBeenCalledWith(
      'pages/contact-log/contact/contact',
      expect.objectContaining({
        errorMessages: expect.objectContaining({
          sentence: 'Select what the contact is related to',
          date: 'Enter a date',
          time: 'Enter a time in the 24-hour format, for example 16:30',
          visor: 'Select if the contact should be included in the ViSOR report',
          sensitivity: 'Select if the contact includes sensitive information',
        }),
      }),
    )
  })

  it('should render with error when sentence is not selected', () => {
    const req = httpMocks.createRequest({
      ...reqBase,
      body: {
        date: '17/5/2024',
        time: '09:30',
        visor: 'No',
        sensitivity: 'No',
      },
    })
    const res = mockAppResponse()

    validation.addContact(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.render).toHaveBeenCalledWith(
      'pages/contact-log/contact/contact',
      expect.objectContaining({
        errorMessages: expect.objectContaining({
          sentence: 'Select what the contact is related to',
        }),
      }),
    )
  })

  it('should render with error when date format is invalid', () => {
    const req = httpMocks.createRequest({
      ...reqBase,
      body: {
        sentence: '1',
        date: 'not-a-date',
        time: '09:30',
        visor: 'No',
        sensitivity: 'No',
      },
    })
    const res = mockAppResponse()

    validation.addContact(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.render).toHaveBeenCalledWith(
      'pages/contact-log/contact/contact',
      expect.objectContaining({
        errorMessages: expect.objectContaining({
          date: 'Enter a date in the correct format, for example 17/5/2024',
        }),
      }),
    )
  })

  it('should render with error when time format is invalid', () => {
    const req = httpMocks.createRequest({
      ...reqBase,
      body: {
        sentence: '1',
        date: '17/5/2024',
        time: '25:00',
        visor: 'No',
        sensitivity: 'No',
      },
    })
    const res = mockAppResponse()

    validation.addContact(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.render).toHaveBeenCalledWith(
      'pages/contact-log/contact/contact',
      expect.objectContaining({
        errorMessages: expect.objectContaining({
          time: 'Enter a time in the 24-hour format, for example 16:30',
        }),
      }),
    )
  })

  it('should render with error when visor is not selected', () => {
    const req = httpMocks.createRequest({
      ...reqBase,
      body: {
        sentence: '1',
        date: '17/5/2024',
        time: '09:30',
        sensitivity: 'No',
      },
    })
    const res = mockAppResponse()

    validation.addContact(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.render).toHaveBeenCalledWith(
      'pages/contact-log/contact/contact',
      expect.objectContaining({
        errorMessages: expect.objectContaining({
          visor: 'Select if the contact should be included in the ViSOR report',
        }),
      }),
    )
  })

  it('should render with error when sensitivity is not selected', () => {
    const req = httpMocks.createRequest({
      ...reqBase,
      body: {
        sentence: '1',
        date: '17/5/2024',
        time: '09:30',
        visor: 'Yes',
      },
    })
    const res = mockAppResponse()

    validation.addContact(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.render).toHaveBeenCalledWith(
      'pages/contact-log/contact/contact',
      expect.objectContaining({
        errorMessages: expect.objectContaining({
          sensitivity: 'Select if the contact includes sensitive information',
        }),
      }),
    )
  })

  it('should pass validation with optional fields omitted', () => {
    const req = httpMocks.createRequest({
      ...reqBase,
      body: {
        sentence: '1',
        date: '17/5/2024',
        time: '09:30',
        visor: 'Yes',
        sensitivity: 'No',
      },
    })
    const res = mockAppResponse()

    validation.addContact(req, res, next)

    expect(next).toHaveBeenCalled()
  })
})
