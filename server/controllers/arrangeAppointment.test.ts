import httpMocks from 'node-mocks-http'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import { isNumericString, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { mockAppResponse } from './mocks'
import { renderError } from '../middleware'
import { mockAppointmentTypes } from './mocks/appointmentTypes'
import { AppointmentSession } from '../models/Appointments'

const uuid = 'f1654ea3-0abb-46eb-860b-654a96edbe20'
const crn = 'X000001'
const number = '1234'
const change = '/path/to/change'

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    toRoshWidget: jest.fn(),
    toPredictors: jest.fn(),
    isValidCrn: jest.fn(),
    isValidUUID: jest.fn(),
    isNumericString: jest.fn(),
    setDataValue: jest.fn(),
  }
})

const mockMiddlewareFn = jest.fn()
jest.mock('../middleware', () => ({
  renderError: jest.fn(() => mockMiddlewareFn),
}))
jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const mockRenderError = renderError as jest.MockedFunction<typeof renderError>
const mockedIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockedIsValidUUID = isValidUUID as jest.MockedFunction<typeof isValidUUID>
const mockedIsNumberString = isNumericString as jest.MockedFunction<typeof isNumericString>
const mockedSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>

jest.mock('uuid', () => ({
  v4: jest.fn(() => uuid),
}))

const req = httpMocks.createRequest({ params: { crn, id: uuid }, session: { data: {} } })

const createMockRequest = ({
  appointmentSession,
  appointmentBody,
  query,
}: {
  appointmentSession?: AppointmentSession
  appointmentBody?: Record<string, string>
  query?: Record<string, string>
}): httpMocks.MockRequest<any> => ({
  ...req,
  params: {
    crn,
    id: uuid,
  },
  query: {
    number,
    ...(query || {}),
  },
  session: {
    ...(req?.session || {}),
    data: {
      ...(req?.session?.data || {}),
      appointments: {
        ...(req?.session?.data?.appointments || {}),
        [crn]: {
          ...(req?.session?.data?.appointments?.[crn] || {}),
          [uuid]: {
            ...(req?.session?.data?.appointments?.[crn]?.[uuid] || {}),
            ...(appointmentSession || {}),
          },
        },
      },
    },
  },
  body: {
    appointments: {
      ...(req?.body?.appointments || {}),
      [crn]: {
        ...(req?.body?.appointments?.[crn] || {}),
        [uuid]: {
          ...(req?.body?.appointments?.[crn]?.[uuid] || {}),
          ...(appointmentBody || {}),
        },
      },
    },
  },
})

const res = mockAppResponse({
  filters: {
    dateFrom: '',
    dateTo: '',
    keywords: '',
  },
  flags: {
    enableRepeatAppointments: true,
  },
})

const redirectSpy = jest.spyOn(res, 'redirect')
const statusSpy = jest.spyOn(res, 'status')
const renderSpy = jest.spyOn(res, 'render')

const getAppointmentTypesSpy = jest
  .spyOn(MasApiClient.prototype, 'getAppointmentTypes')
  .mockImplementation(() => Promise.resolve(mockAppointmentTypes))

describe('controllers/arrangeAppointment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('redirectToType', () => {
    const mockReq = createMockRequest({})
    describe('CRN and UUID are valid in request params', () => {
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(true)
        await controllers.arrangeAppointments.redirectToType()(mockReq, res)
      })
      it('should redirect to the type page', () => {
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/type`)
      })
    })
    describe('if CRN or UUID are invalid format in request params', () => {
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(false)
        mockedIsValidUUID.mockReturnValue(false)
        await controllers.arrangeAppointments.redirectToType()(mockReq, res)
      })
      it('should return a status of 404 and render the error page', () => {
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      })
      it('should not redirect to the type page', () => {
        expect(redirectSpy).not.toHaveBeenCalled()
      })
    })
  })
  //   describe('getType', () => {})
  xdescribe('postType', () => {
    describe('CRN and UUID are valid in request params', () => {
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(true)
        mockedIsNumberString.mockReturnValue(true)
      })
      describe('If change url not in query', () => {
        const mockReq = createMockRequest({})
        beforeEach(async () => {
          await controllers.arrangeAppointments.postType()(mockReq, res)
        })
        it('should redirect to the sentences page', () => {
          expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/sentence?number=${number}`)
        })
      })
      describe('If change url in query', () => {
        beforeEach(async () => {
          const mockReq = { ...req, query: { change } } as httpMocks.MockRequest<any>
          await controllers.arrangeAppointments.postType()(mockReq, res)
        })
        it('should redirect to the change url', () => {
          expect(redirectSpy).toHaveBeenCalledWith(change)
        })
      })
    })
    describe('If no number in query', () => {
      beforeEach(async () => {
        const mockReq = { ...req, query: {} } as httpMocks.MockRequest<any>
        await controllers.arrangeAppointments.postType()(mockReq, res)
      })
      it('should redirect to the sentence page with no number query parameter in url', () => {
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
      })
    })
    describe('if CRN is invalid format in request params', () => {
      const mockReq = createMockRequest({})
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(false)
        mockedIsValidUUID.mockReturnValue(true)
        mockedIsNumberString.mockReturnValue(true)
        await controllers.arrangeAppointments.postType()(mockReq, res)
      })
      it('should return a status of 404 and render the error page', () => {
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      })
    })
    describe('if UUID is invalid format in request params', () => {
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(false)
        mockedIsNumberString.mockReturnValue(true)
        await controllers.arrangeAppointments.postType()(req, res)
      })
      it('should return a status of 404 and render the error page', () => {
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
      })
    })
    describe('if number is invalid format in request params', () => {
      const mockReq = createMockRequest({})
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(true)
        mockedIsNumberString.mockReturnValue(false)
        await controllers.arrangeAppointments.postType()(mockReq, res)
      })
      it('should return a status of 404 and render the error page', () => {
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      })
    })
  })
  describe('getSentence', () => {
    describe('If type page has not been completed', () => {
      const appointmentSession: Record<string, string> = { type: null }
      const mockReq = createMockRequest({ appointmentSession })

      it('if crn and uuid are valid in request params', async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(true)
        await controllers.arrangeAppointments.getSentence()(mockReq, res)
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/type`)
      })
      it('if crn is invalid in request params', async () => {
        mockedIsValidCrn.mockReturnValue(false)
        mockedIsValidUUID.mockReturnValue(true)
        await controllers.arrangeAppointments.getSentence()(mockReq, res)
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      })
      it('if uuid is invalid in request params', async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(false)
        await controllers.arrangeAppointments.getSentence()(mockReq, res)
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      })
    })
    describe('If type page has been completed', () => {
      beforeEach(async () => {
        const appointmentSession: Record<string, string> = { type: 'appointment type' }
        const mockReq = createMockRequest({ appointmentSession })
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(true)
        await controllers.arrangeAppointments.getSentence()(mockReq, res)
      })
      it('should render the sentence page', () => {
        expect(renderSpy).toHaveBeenCalledWith(`pages/arrange-appointment/sentence`, {
          crn,
          id: uuid,
          change: undefined,
        })
      })
    })
  })

  describe('postSentence', () => {
    it('should redirect to the change url if found in the request query', async () => {
      const mockReq = createMockRequest({ query: { change } })
      await controllers.arrangeAppointments.postSentence()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(change)
    })
    it('should return a 404 and render the error page if CRN or UUId is invalid in request params', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      await controllers.arrangeAppointments.postSentence()(req, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
      expect(redirectSpy).not.toHaveBeenCalled()
    })
  })
  //   describe('getLocation', () => {})
  describe('postLocation', () => {
    it('if CRN or UUID in request params are invalid, it should return a 404 status and render the error page', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      const mockReq = createMockRequest({ query: { change } })
      await controllers.arrangeAppointments.postLocation()(mockReq, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should redirect to the location not in list page if selected', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const appointmentSession: AppointmentSession = {
        user: {
          username: 'user-1',
          locationCode: `The location I’m looking for is not in this list`,
          teamCode: '',
          providerCode: '',
        },
      }
      const mockReq = createMockRequest({ appointmentSession })
      await controllers.arrangeAppointments.postLocation()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/location-not-in-list`)
    })
    it('should redirect to the schedule page', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const appointmentSession: AppointmentSession = {
        user: {
          username: 'user-1',
          locationCode: `location`,
          providerCode: '',
          teamCode: '',
        },
      }
      const mockReq = createMockRequest({ appointmentSession })
      await controllers.arrangeAppointments.postLocation()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/date-time`)
    })
    it('should redirect to change url if in request params', async () => {
      const mockReq = createMockRequest({ query: { change } })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      await controllers.arrangeAppointments.postLocation()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(change)
    })
  })
  //   describe('getLocationNotInList', () => {})
  //   describe('getDateTime', () => {})
  describe('postDateTime', () => {
    it('if CRN or UUID in request params are invalid, it should return a 404 status and render the error page', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      const mockReq = createMockRequest({ query: { change } })
      await controllers.arrangeAppointments.postDateTime()(mockReq, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should redirect to the repeating page', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const mockReq = createMockRequest({})
      await controllers.arrangeAppointments.postDateTime()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/repeating`)
    })
    it('should redirect to change url if in request params', async () => {
      const mockReq = createMockRequest({ query: { change } })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      await controllers.arrangeAppointments.postDateTime()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(change)
    })
  })
  //   describe('getRepeating', () => {})
  describe('postRepeating', () => {
    it('should reset the count, frequency and dates if a one off appointment', async () => {
      const appointmentSession: AppointmentSession = {
        user: {
          username: 'user-1',
          locationCode: `location`,
          teamCode: '',
        },
        repeating: 'No',
      }
      const mockReq = createMockRequest({ appointmentSession })
      const expected: AppointmentSession = {
        ...appointmentSession,
        repeating: 'No',
        interval: 'DAY',
        numberOfAppointments: '1',
        repeatingDates: [],
        numberOfRepeatAppointments: '0',
      }
      await controllers.arrangeAppointments.postRepeating()(mockReq, res)
      expect(mockedSetDataValue).toHaveBeenCalledWith(mockReq.session.data, ['appointments', crn, uuid], expected)
    })
    it('if CRN or UUID in request params are invalid, it should return a 404 status and render the error page', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      const mockReq = createMockRequest({ query: { change } })
      await controllers.arrangeAppointments.postRepeating()(mockReq, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should redirect to the notes page', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const mockReq = createMockRequest({})
      await controllers.arrangeAppointments.postRepeating()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/add-notes`)
    })
    it('should redirect to change url if in request params', async () => {
      const mockReq = createMockRequest({ query: { change } })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      await controllers.arrangeAppointments.postRepeating()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(change)
    })
  })
  //   describe('getPreview', () => {})
  describe('postPreview', () => {
    it('if CRN or UUID in request params are invalid, it should return a 404 status and render the error page', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      const mockReq = createMockRequest({})
      await controllers.arrangeAppointments.postNotes()(mockReq, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should redirect to the check your answers page', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const mockReq = createMockRequest({})
      await controllers.arrangeAppointments.postNotes()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/check-your-answers`)
    })
  })
  //   describe('getCheckYourAnswers', () => {})
  describe('postCheckYourAnswers', () => {
    it('if CRN or UUID in request params are invalid, it should return a 404 status and render the error page', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      const mockReq = createMockRequest({})
      await controllers.arrangeAppointments.postCheckYourAnswers()(mockReq, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should redirect to the confirmation page', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const mockReq = createMockRequest({})
      await controllers.arrangeAppointments.postCheckYourAnswers()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/confirmation`)
    })
  })
  //   describe('getConfirmation', () => {})
  //   describe('postConfirmation', () => {})
})
