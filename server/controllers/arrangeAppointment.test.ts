import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import { isNumericString, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { mockAppResponse } from './mocks'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { postAppointments, renderError } from '../middleware'
import { AppointmentSession } from '../models/Appointments'
import { Data } from '../models/Data'
import { AppResponse } from '../models/Locals'

const uuid = 'f1654ea3-0abb-46eb-860b-654a96edbe20'
const uuid2 = 'f1654ea3-0abb-46eb-860b-654a96edbe21'
const crn = 'X000001'
const number = '1234'
const change = '/path/to/change'
const username = 'user-1'

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
  postAppointments: jest.fn(),
}))
jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})
jest.mock('uuid', () => ({
  v4: jest.fn(),
}))

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
const mockRenderError = renderError as jest.MockedFunction<typeof renderError>
const mockedIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockedIsValidUUID = isValidUUID as jest.MockedFunction<typeof isValidUUID>
const mockedIsNumberString = isNumericString as jest.MockedFunction<typeof isNumericString>
const mockedSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>
const mockedPostAppointments = postAppointments as jest.MockedFunction<typeof postAppointments>
const mockedV4 = uuidv4 as jest.MockedFunction<typeof uuidv4>
const req = httpMocks.createRequest({ params: { crn, id: uuid }, session: { data: {} } })

mockedV4.mockReturnValue(uuid as unknown as ReturnType<typeof uuidv4>)

const createMockRequest = ({
  dataSession,
  appointmentSession,
  appointmentBody,
  query,
}: {
  dataSession?: Data
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
    data: {
      ...(dataSession || {}),
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

const createMockResponse = (localsResponse?: Record<string, any>): AppResponse =>
  mockAppResponse({
    filters: {
      dateFrom: '',
      dateTo: '',
      keywords: '',
    },
    flags: {
      enableRepeatAppointments: true,
    },
    ...(localsResponse || {}),
  })

const res = createMockResponse()

const redirectSpy = jest.spyOn(res, 'redirect')
const renderSpy = jest.spyOn(res, 'render')

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
  describe('postType', () => {
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
  describe('getLocation', () => {
    it('if CRN or UUID in request params are invalid, it should return a 404 status and render the error page', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      const mockReq = createMockRequest({ query: { change } })
      await controllers.arrangeAppointments.getLocation()(mockReq, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('If session has errors, it should delete the errors', async () => {
      const mockReq = createMockRequest({
        dataSession: {
          errors: {
            errorList: [{ text: '', href: '' }],
            errorMessages: {
              '#field': { text: '' },
            },
          },
        },
      })
      await controllers.arrangeAppointments.getLocation()(mockReq, res)
      expect(mockReq.session.errors).toBeUndefined()
    })
    it('If session has no user locations and type of appointment requires a location, it should redirect to the location not in list page', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const mockReq = createMockRequest({
        dataSession: { locations: { [username]: [] } },
      })
      const mockRes = createMockResponse({
        appointment: {
          type: {
            isLocationRequired: true,
          },
        },
        userLocations: [],
      })
      const spy = jest.spyOn(mockRes, 'redirect')
      await controllers.arrangeAppointments.getLocation()(mockReq, mockRes)
      expect(spy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/location-not-in-list?noLocations=true`)
    })
    it('user locations', async () => {
      const mockReq = createMockRequest({
        query: { change: '' },
        dataSession: {
          errors: null,
          locations: {
            [username]: [
              {
                id: 1500066114,
                code: 'LDN_BCS',
                description: '1 REGARTH AVENUE',
                address: {
                  buildingNumber: '1',
                  streetName: 'Regarth Avenue',
                  town: 'Romford',
                  county: 'Essex',
                  postcode: 'RM1 1TP',
                },
              },
            ],
          },
        },
      })
      const mockRes = createMockResponse({
        appointment: {
          type: {
            isLocationRequired: false,
          },
        },
        userLocations: [
          {
            id: 1500066114,
            code: 'LDN_BCS',
            description: '1 REGARTH AVENUE',
            address: {
              buildingNumber: '1',
              streetName: 'Regarth Avenue',
              town: 'Romford',
              county: 'Essex',
              postcode: 'RM1 1TP',
            },
          },
        ],
      })
      const spy = jest.spyOn(mockRes, 'render')
      await controllers.arrangeAppointments.getLocation()(mockReq, mockRes)
      expect(spy).toHaveBeenCalledWith(`pages/arrange-appointment/location`, {
        crn,
        id: uuid,
        errors: mockReq.session.data.errors,
        change: mockReq.query.change,
      })
    })
  })

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
    it('should return a 404 status and render the error page, if CRN or UUID in request params are invalid', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      const mockReq = createMockRequest({ query: { change } })
      await controllers.arrangeAppointments.postDateTime()(mockReq, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      expect(redirectSpy).not.toHaveBeenCalled()
    })

    it('should update the repeating dates and until date if changing the date and repeating appointments enabled', async () => {
      const mockReq = createMockRequest({
        query: { change },
        appointmentSession: {
          date: '2025-07-07',
          start: '9:00am',
          end: '9:30am',
          numberOfAppointments: '3',
          numberOfRepeatAppointments: '2',
          interval: 'WEEK',
          repeating: 'Yes',
        },
      })
      const mockRes = createMockResponse({ flags: { enableRepeatAppointments: true } })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      await controllers.arrangeAppointments.postDateTime()(mockReq, mockRes)
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'until'],
        '2025-07-21',
      )
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'repeatingDates'],
        ['2025-07-14', '2025-07-21'],
      )
    })
    it('should set the default date values if repeating appointment disabled and not changing the date', async () => {
      const mockReq = createMockRequest({
        query: { change },
        appointmentSession: {
          date: '2025-07-07',
          start: '9:00am',
          end: '9:30am',
          numberOfAppointments: '1',
          numberOfRepeatAppointments: '0',
          interval: 'DAY',
        },
      })
      const mockRes = createMockResponse({ flags: { enableRepeatAppointments: false } })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      await controllers.arrangeAppointments.postDateTime()(mockReq, mockRes)
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'numberOfAppointments'],
        '1',
      )
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'numberOfRepeatAppointments'],
        '',
      )
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'numberOfRepeatAppointments'],
        '',
      )
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'interval'],
        'DAY',
      )
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'until'],
        '2025-07-07',
      )
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'repeatingDates'],
        [],
      )
    })

    it('should redirect to the repeating page if repeating appointments flag enabled', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const mockRes = createMockResponse({ flags: { enableRepeatAppointments: true } })
      const spy = jest.spyOn(mockRes, 'redirect')
      const mockReq = createMockRequest({
        appointmentSession: {
          date: '2025-07-07',
          start: '9:00am',
          end: '9:30am',
          numberOfAppointments: '1',
          numberOfRepeatAppointments: '0',
          interval: 'DAY',
        },
      })
      await controllers.arrangeAppointments.postDateTime()(mockReq, mockRes)
      expect(spy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/repeating`)
    })

    it('should redirect to the add notes page if repeating appointments flag disabled', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const mockRes = createMockResponse({ flags: { enableRepeatAppointments: false } })
      const spy = jest.spyOn(mockRes, 'redirect')
      const mockReq = createMockRequest({})
      await controllers.arrangeAppointments.postDateTime()(mockReq, mockRes)
      expect(spy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/add-notes`)
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
      mockedPostAppointments.mockReturnValue(mockMiddlewareFn)
      await controllers.arrangeAppointments.postCheckYourAnswers(hmppsAuthClient)(mockReq, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should redirect to the confirmation page', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const mockReq = createMockRequest({})
      await controllers.arrangeAppointments.postCheckYourAnswers(hmppsAuthClient)(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/confirmation`)
    })
  })
  //   describe('getConfirmation', () => {})
  describe('postConfirmation', () => {
    const appointmentSession: AppointmentSession = {
      user: {
        username: 'user-1',
        locationCode: `location`,
        teamCode: '',
      },
      repeating: 'No',
      date: '7/7/2025',
      start: '9:00am',
      end: '10:00am',
      repeatingDates: ['14/7/2025', '21/7/2025'],
      until: '21/7/2025',
      numberOfAppointments: '3',
      numberOfRepeatAppointments: '2',
    }
    const mockReq = createMockRequest({ appointmentSession })
    it('if CRN or UUID in request params are invalid, it should return a 404 status and render the error page', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      mockedV4.mockReturnValueOnce(uuid2 as unknown as ReturnType<typeof uuidv4>)
      mockedPostAppointments.mockReturnValue(mockMiddlewareFn)
      await controllers.arrangeAppointments.postConfirmation(hmppsAuthClient)(mockReq, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should clone the current appointment with new uuid', async () => {
      mockedV4.mockReturnValueOnce(uuid2 as unknown as ReturnType<typeof uuidv4>)
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      await controllers.arrangeAppointments.postConfirmation(hmppsAuthClient)(mockReq, res)
      const expectedAppt: AppointmentSession = {
        ...appointmentSession,
        date: '',
        start: '',
        end: '',
        repeatingDates: [],
        until: '',
        numberOfAppointments: '1',
        numberOfRepeatAppointments: '0',
      }
      expect(mockedSetDataValue).toHaveBeenCalledWith(mockReq.session.data, ['appointments', crn, uuid2], expectedAppt)
    })
    it('should redirect to arrange another appointment page', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      mockedV4.mockReturnValueOnce(uuid2 as unknown as ReturnType<typeof uuidv4>)
      await controllers.arrangeAppointments.postConfirmation(hmppsAuthClient)(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid2}/arrange-another-appointment`)
    })
  })
})
