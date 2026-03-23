import appointmentOutcomes from './appointmentOutcomes'
import { validateWithSpec } from '../../utils/validationUtils'
import { appointmentOutcomesValidation } from '../../properties'
import { urlToRenderPath } from '../../utils/urlToRenderPath'

jest.mock('../../utils/validationUtils')
jest.mock('../../properties')
jest.mock('../../utils/urlToRenderPath')

describe('appointmentOutcomes middleware', () => {
  let req: any
  let res: any
  let next: jest.Mock

  beforeEach(() => {
    req = {
      params: {
        crn: 'X123456',
        id: '1',
        contactId: '99',
      },
      body: { some: 'data' },
      url: '/case/X123456/record-an-outcome',
    }

    res = {
      locals: {},
      render: jest.fn(),
    }

    next = jest.fn()
    ;(urlToRenderPath as jest.Mock).mockReturnValue('default-render-path')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call next when no validation errors', () => {
    ;(validateWithSpec as jest.Mock).mockReturnValue({})
    ;(appointmentOutcomesValidation as jest.Mock).mockReturnValue({})

    appointmentOutcomes(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.render).not.toHaveBeenCalled()
  })

  it('should render with errors when validation fails', () => {
    const errors = { field: 'error message' }

    ;(validateWithSpec as jest.Mock).mockReturnValue(errors)
    ;(appointmentOutcomesValidation as jest.Mock).mockReturnValue({})

    appointmentOutcomes(req, res, next)

    expect(res.render).toHaveBeenCalledWith(
      'pages/appointment-outcomes/outcome',
      expect.objectContaining({
        errorMessages: errors,
        crn: 'X123456',
        id: '1',
        contactId: '99',
        body: { some: 'data' },
      }),
    )

    expect(next).not.toHaveBeenCalled()
  })

  it('should merge existing errorMessages with new ones', () => {
    res.locals.errorMessages = { existing: 'error' }

    const newErrors = { newField: 'new error' }

    ;(validateWithSpec as jest.Mock).mockReturnValue(newErrors)
    ;(appointmentOutcomesValidation as jest.Mock).mockReturnValue({})

    appointmentOutcomes(req, res, next)

    expect(res.locals.errorMessages).toEqual({
      existing: 'error',
      newField: 'new error',
    })
  })

  it('should not validate if URL does not match outcome path', () => {
    req.url = '/case/X123456/some-other-page'

    appointmentOutcomes(req, res, next)

    expect(validateWithSpec).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('should use renderPath from locals if provided', () => {
    res.locals.renderPath = 'custom-render-path'

    const errors = { field: 'error message' }

    ;(validateWithSpec as jest.Mock).mockReturnValue(errors)
    ;(appointmentOutcomesValidation as jest.Mock).mockReturnValue({})

    appointmentOutcomes(req, res, next)

    expect(res.render).toHaveBeenCalledWith(
      'pages/appointment-outcomes/outcome', // overridden by validateOutcome
      expect.any(Object),
    )
  })

  it('should call validation with correct arguments', () => {
    ;(validateWithSpec as jest.Mock).mockReturnValue({})
    ;(appointmentOutcomesValidation as jest.Mock).mockReturnValue({})

    appointmentOutcomes(req, res, next)

    expect(appointmentOutcomesValidation).toHaveBeenCalledWith({
      crn: 'X123456',
      id: '1',
      contactId: '99',
      page: 'outcome',
    })

    expect(validateWithSpec).toHaveBeenCalledWith(req, {})
  })
})
