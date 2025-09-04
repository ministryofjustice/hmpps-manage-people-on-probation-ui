import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import controllers from '.'
import { isNumericString, isValidCrn, isValidUUID, setDataValue } from '../utils'
import { mockAppResponse } from './mocks'
import HmppsAuthClient from '../data/hmppsAuthClient'
import { postAppointments, renderError, cloneAppointmentAndRedirect } from '../middleware'
import { AppointmentSession } from '../models/Appointments'
import { Data } from '../models/Data'
import { AppResponse } from '../models/Locals'
import { ArrangedSession } from '../models/ArrangedSession'

const uuid = 'f1654ea3-0abb-46eb-860b-654a96edbe20'
const uuid2 = 'f1654ea3-0abb-46eb-860b-654a96edbe21'
const crn = 'X000001'
const number = '1234'
const change = '/path/to/change'
const username = 'user-1'

jest.mock('../models/ArrangedSession')

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
  cloneAppointmentAndRedirect: jest.fn(),
}))
jest.mock('uuid', () => ({
  v4: jest.fn(),
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
const mockedCloneAppointment = cloneAppointmentAndRedirect as jest.MockedFunction<typeof cloneAppointmentAndRedirect>

jest.mock('uuid', () => ({
  v4: jest.fn(() => uuid),
}))
const mockedUuidv4 = uuidv4 as jest.Mock

const req = httpMocks.createRequest({ params: { crn, id: uuid }, session: { data: {} } })

const createMockRequest = ({
  request,
  dataSession,
  appointmentSession,
  appointmentBody,
  query,
}: {
  request?: Record<string, string>
  dataSession?: Data
  appointmentSession?: AppointmentSession
  appointmentBody?: Record<string, string>
  query?: Record<string, string>
} = {}): httpMocks.MockRequest<any> => ({
  ...req,
  ...(request || {}),
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
      ...(dataSession || {}),
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
    user: {
      username,
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
  describe('redirectToSentence', () => {
    mockedUuidv4.mockReturnValueOnce(uuid)
    const mockReq = createMockRequest({})
    describe('CRN and UUID are valid in request params', () => {
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(true)
        await controllers.arrangeAppointments.redirectToSentence()(mockReq, res)
      })
      it('should redirect to the sentence page', () => {
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
      })
    })
    describe('if CRN or UUID are invalid format in request params', () => {
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(false)
        mockedIsValidUUID.mockReturnValue(false)
        await controllers.arrangeAppointments.redirectToSentence()(mockReq, res)
      })
      it('should return a status of 404 and render the error page', () => {
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      })
      it('should not redirect to the sentence page', () => {
        expect(redirectSpy).not.toHaveBeenCalled()
      })
    })
  })
  describe('getSentence', () => {
    const mockReq = createMockRequest({
      dataSession: {
        errors: {
          errorList: [{ text: '', href: '' }],
          errorMessages: {
            '#anchor': { text: '' },
          },
        },
      },
    })
    it('should delete the session errors', async () => {
      await controllers.arrangeAppointments.getSentence()(mockReq, res)
      expect(mockReq.session.data.errors).toBeUndefined()
    })
    it('should render the sentence page', async () => {
      await controllers.arrangeAppointments.getSentence()(mockReq, res)
      expect(renderSpy).toHaveBeenCalledWith(`pages/arrange-appointment/sentence`, {
        crn,
        id: uuid,
        change: undefined,
        errors: undefined,
      })
    })
  })
  describe('postSentence', () => {
    describe('CRN and UUID are valid in request params', () => {
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(true)
        mockedIsNumberString.mockReturnValue(true)
      })
      describe('If change url not in query', () => {
        const mockReq = createMockRequest({})
        beforeEach(async () => {
          await controllers.arrangeAppointments.postSentence()(mockReq, res)
        })
        it('should redirect to the types page', () => {
          expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/type`) // ?number=1234
        })
      })
    })
    describe('If no number in query', () => {
      beforeEach(async () => {
        const mockReq = { ...req, query: {} } as httpMocks.MockRequest<any>
        await controllers.arrangeAppointments.postSentence()(mockReq, res)
      })
      it('should redirect to the types page with no number query parameter in url', () => {
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/type`)
      })
    })
    describe('if CRN is invalid format in request params', () => {
      const mockReq = createMockRequest({})
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(false)
        mockedIsValidUUID.mockReturnValue(true)
        mockedIsNumberString.mockReturnValue(true)
        await controllers.arrangeAppointments.postSentence()(mockReq, res)
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
        await controllers.arrangeAppointments.postSentence()(req, res)
      })
      it('should return a status of 404 and render the error page', () => {
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(req, res)
      })
    })
  })
  describe('getType', () => {
    describe('If sentence page has not been completed', () => {
      const appointmentSession: Record<string, string> = { eventId: null }
      const mockReq = createMockRequest({ appointmentSession })

      it('if crn and uuid are valid in request params', async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(true)
        await controllers.arrangeAppointments.getType()(mockReq, res)
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/sentence`)
      })
      it('if crn is invalid in request params', async () => {
        mockedIsValidCrn.mockReturnValue(false)
        mockedIsValidUUID.mockReturnValue(true)
        await controllers.arrangeAppointments.getType()(mockReq, res)
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      })
      it('if uuid is invalid in request params', async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(false)
        await controllers.arrangeAppointments.getType()(mockReq, res)
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      })
    })
    describe('If sentence page has been completed', () => {
      beforeEach(async () => {
        const appointmentSession: Record<string, string> = { eventId: '49' }
        const mockReq = createMockRequest({ appointmentSession })
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(true)
        await controllers.arrangeAppointments.getType()(mockReq, res)
      })
      it('should render the type page', () => {
        expect(renderSpy).toHaveBeenCalledWith(`pages/arrange-appointment/type`, {
          crn,
          id: uuid,
          change: undefined,
          errors: undefined,
          personLevel: false,
        })
      })
    })
  })

  describe('postType', () => {
    it('should redirect to the change url if found in the request query', async () => {
      const mockReq = createMockRequest({ query: { change } })
      await controllers.arrangeAppointments.postType()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(change)
    })
    it('should return a 404 and render the error page if CRN or UUId is invalid in request params', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      await controllers.arrangeAppointments.postType()(req, res)
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
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const mockReq = createMockRequest({
        dataSession: {
          errors: {
            errorList: [{ text: '', href: '' }],
            errorMessages: {
              '#anchor': { text: '' },
            },
          },
        },
      })
      const mockRes = createMockResponse({
        appointment: {
          type: {
            isLocationRequired: true,
          },
        },
        userLocations: [],
      })
      await controllers.arrangeAppointments.getLocation()(mockReq, mockRes)
      expect(mockReq.session.data.errors).toBeUndefined()
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
        errors: null,
        change: mockReq.query.change,
      })
    })
  })
  describe('getWhoWillAttend', () => {
    beforeEach(async () => {
      await controllers.arrangeAppointments.getWhoWillAttend()(mockReq, res)
    })
    const mockReq = createMockRequest({
      dataSession: {
        errors: {
          errorList: [{ text: '', href: '' }],
          errorMessages: {
            '#anchor': { text: '' },
          },
        },
      },
    })
    it('should delete the session errors', async () => {
      expect(mockReq.session.data.errors).toBeUndefined()
    })
    it('should render the attendance page', () => {
      expect(renderSpy).toHaveBeenCalledWith(`pages/arrange-appointment/attendance`, {
        crn,
        id: uuid,
        errors: mockReq.session.data.errors,
      })
    })
  })
  describe('postWhoWillAttend', () => {
    const teamCode = '123'
    const providerCode = '456'
    it('if CRN or UUID in request params are invalid, it should return a 404 status and render the error page', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      const mockReq = createMockRequest({ query: { change } })
      await controllers.arrangeAppointments.postWhoWillAttend()(mockReq, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('should redirect to the attendance page if page and providerCode query parameters are in url', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const mockReq = createMockRequest({ query: { page: 'true', providerCode } })
      await controllers.arrangeAppointments.postWhoWillAttend()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(
        `/case/${crn}/arrange-appointment/${uuid}/attendance?providerCode=${providerCode}`,
      )
    })
    it('should redirect to the attendance page if page, providerCode and teamCode query parameters are in url', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const mockReq = createMockRequest({ query: { page: 'true', providerCode, teamCode } })
      await controllers.arrangeAppointments.postWhoWillAttend()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(
        `/case/${crn}/arrange-appointment/${uuid}/attendance?providerCode=${providerCode}&teamCode=${teamCode}`,
      )
    })
    it('should redirect to the change url if the change query parameter exists in the url', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const mockReq = createMockRequest({ query: { change } })
      await controllers.arrangeAppointments.postWhoWillAttend()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(change)
    })
    it('should redirect to the location page if page query parameter does not exist in url', async () => {
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const mockReq = createMockRequest()
      await controllers.arrangeAppointments.postWhoWillAttend()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/location`)
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
  describe('getLocationNotInList', () => {
    const mockReq = createMockRequest({
      query: { noLocations: 'true' },
    })
    beforeEach(async () => {
      await controllers.arrangeAppointments.getLocationNotInList()(mockReq, res)
    })
    it('should render the location not in list page', () => {
      expect(renderSpy).toHaveBeenCalledWith(`pages/arrange-appointment/location-not-in-list`, {
        crn,
        id: uuid,
        noLocations: mockReq.query.noLocations,
      })
    })
  })
  describe('getDateTime', () => {
    beforeAll(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2025-07-01T09:00:00Z')) // 10:00 BST
    })
    afterAll(() => {
      jest.useRealTimers()
    })
    it('should set local vars for error messages if validation query param is in url', async () => {
      const mockReq = createMockRequest({ query: { validation: 'true' } })
      await controllers.arrangeAppointments.getDateTime()(mockReq, res)
      expect(res.locals.errorMessages).toStrictEqual({
        [`appointments-${crn}-${uuid}-date`]: 'Enter or select a date',
        [`appointments-${crn}-${uuid}-start`]: 'Select a start time',
        [`appointments-${crn}-${uuid}-end`]: 'Select an end time',
      })
    })
    it('should render the date/time page', async () => {
      const mockReq = createMockRequest({ query: {} })
      await controllers.arrangeAppointments.getDateTime()(mockReq, res)
      expect(renderSpy).toHaveBeenCalledWith(`pages/arrange-appointment/date-time`, {
        crn,
        id: uuid,
        _minDate: '1/7/2025',
        _maxDate: '31/12/2199',
        change: undefined,
        showValidation: false,
      })
    })
  })
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
      jest.spyOn(ArrangedSession, 'generateRepeatedAppointments').mockReturnValue([
        { uuid: '1', date: '19/4/2025' },
        { uuid: '2', date: '26/4/2025' },
      ])
      const mockRes = createMockResponse({ flags: { enableRepeatAppointments: true } })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      await controllers.arrangeAppointments.postDateTime()(mockReq, mockRes)
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'until'],
        '26/4/2025',
      )
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'repeatingDates'],
        ['19/4/2025', '26/4/2025'],
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
  describe('getRepeating', () => {
    it('should render the 404 page if repeat appointments flag is not enabled', async () => {
      const mockReq = createMockRequest()
      const mockRes = createMockResponse({
        flags: {
          enableRepeatAppointments: false,
        },
      })
      await controllers.arrangeAppointments.getRepeating()(mockReq, mockRes)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, mockRes)
    })
    it(`should update appointment.repeating to 'Yes' if interval or numberOfRepeatAppointments value is in req.query`, async () => {
      const mockReq = createMockRequest({ query: { numberOfRepeatAppointments: '2' } })
      await controllers.arrangeAppointments.getRepeating()(mockReq, res)
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'repeating'],
        'Yes',
      )
    })
    it(`should update appointment.interval session value to req.query.interval if included in the url`, async () => {
      const mockReq = createMockRequest({ query: { interval: 'DAY' } })
      await controllers.arrangeAppointments.getRepeating()(mockReq, res)
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'interval'],
        mockReq.query.interval,
      )
    })
    it(`should update appointment.numberOfRepeatAppointments session value to req.query.numberOfRepeatAppointments if included in the url`, async () => {
      const mockReq = createMockRequest({ query: { numberOfRepeatAppointments: '3' } })
      await controllers.arrangeAppointments.getRepeating()(mockReq, res)
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'numberOfRepeatAppointments'],
        mockReq.query.numberOfRepeatAppointments,
      )
    })
    it('should set the repeatingDates', async () => {
      const spy = jest.spyOn(ArrangedSession, 'generateRepeatedAppointments').mockReturnValue([
        { uuid: '1', date: '19/4/2025' },
        { uuid: '2', date: '26/4/2025' },
      ])
      const mockReq = createMockRequest({
        appointmentSession: {
          date: '12/4/2025',
          interval: 'FORTNIGHT',
          numberOfRepeatAppointments: '2',
        },
      })
      await controllers.arrangeAppointments.getRepeating()(mockReq, res)
      expect(spy).toHaveBeenCalledWith(mockReq.session.data.appointments[crn][uuid], 'week', 2)
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'repeatingDates'],
        ['19/4/2025', '26/4/2025'],
      )
      expect(res.locals.lastAppointmentDate).toEqual('26/4/2025')
    })
    // it('should render the repeating page', () => {})
  })
  describe('postRepeating', () => {
    it('should render the 404 page if repeat appointments flag is not enabled', async () => {
      const mockReq = createMockRequest()
      const mockRes = createMockResponse({
        flags: {
          enableRepeatAppointments: false,
        },
      })
      await controllers.arrangeAppointments.postRepeating()(mockReq, mockRes)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, mockRes)
    })
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
  // xdescribe('getNotes', () => {
  //   it('should', async () => {
  //     await controllers.arrangeAppointments.getNotes(hmppsAuthClient)(mockReq, res)
  //   })
  // })
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
  describe('getConfirmation', () => {
    it('should render the confirmation page', async () => {
      const mockReq = createMockRequest()
      await controllers.arrangeAppointments.getConfirmation()(mockReq, res)
      expect(renderSpy).toHaveBeenCalledWith(`pages/arrange-appointment/confirmation`, { crn })
    })
  })
  describe('postConfirmation', () => {
    const appointmentSession: AppointmentSession = {
      user: {
        username: 'user-1',
        locationCode: '',
        teamCode: '',
        providerCode: '',
      },
      type: '...',
      date: '2025/7/2',
      start: '9:00am',
      end: '9:30am',
      repeatingDates: ['2025/7/9', '2025/7/16'],
    }
    it('if CRN or UUID in request params are invalid, it should return a 404 status and render the error page', async () => {
      mockedUuidv4.mockReturnValueOnce(uuid2)
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      const mockReq = createMockRequest()
      await controllers.arrangeAppointments.postConfirmation()(mockReq, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      expect(redirectSpy).not.toHaveBeenCalled()
    })

    it('should clone the current appointment with no date or time set and save it to session', async () => {
      const mockReq = createMockRequest({
        appointmentSession,
      })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      const handler = jest.fn()
      mockedCloneAppointment.mockReturnValue(handler)
      await controllers.arrangeAppointments.postConfirmation()(mockReq, res)
      expect(mockedCloneAppointment).toHaveBeenCalledWith(appointmentSession)
      expect(handler).toHaveBeenCalledWith(mockReq, res)
    })
  })
  describe('getArrangeAnotherAppointment', () => {
    it('should render the page', async () => {
      const url = `/case/${crn}/arrange-appointment/${uuid}/arrange-another-appointment}`
      const mockReq = createMockRequest({
        request: { url },
      })
      await controllers.arrangeAppointments.getArrangeAnotherAppointment()(mockReq, res)
      expect(renderSpy).toHaveBeenCalledWith(`pages/arrange-appointment/arrange-another-appointment`, {
        url,
        crn,
        id: uuid,
      })
    })
  })
  describe('postArrangeAnotherAppointment', () => {
    const url = `/case/${crn}/arrange-appointment/${uuid}/arrange-another-appointment}`
    it('if CRN or UUID in request params are invalid, it should return a 404 status and render the error page', async () => {
      mockedIsValidCrn.mockReturnValue(false)
      mockedIsValidUUID.mockReturnValue(false)
      const mockReq = createMockRequest({})
      await controllers.arrangeAppointments.postArrangeAnotherAppointment()(mockReq, res)
      expect(mockRenderError).toHaveBeenCalledWith(404)
      expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      expect(redirectSpy).not.toHaveBeenCalled()
    })
    it('if no date has been submitted for the appointment, it should redirect to the date/time page and display validation errors', async () => {
      const mockReq = createMockRequest({
        request: {
          url,
        },
        appointmentSession: {
          type: 'type',
          date: '',
          start: '',
          end: '',
          until: '',
        },
      })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      await controllers.arrangeAppointments.postArrangeAnotherAppointment()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(
        `/case/${crn}/arrange-appointment/${uuid}/date-time?validation=true&change=${url}`,
      )
    })
    it('should redirect to the confirmation page if all required values are present in appointment session', async () => {
      const mockReq = createMockRequest({
        appointmentSession: { type: 'type', date: '2025/7/2', start: '9:00am', end: '9:30am' },
      })
      mockedIsValidCrn.mockReturnValue(true)
      mockedIsValidUUID.mockReturnValue(true)
      await controllers.arrangeAppointments.postArrangeAnotherAppointment()(mockReq, res)
      expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/confirmation`)
    })
  })
})
