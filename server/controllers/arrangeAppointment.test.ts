import httpMocks from 'node-mocks-http'
import { v4 as uuidv4 } from 'uuid'
import logger from '../../logger'
import controllers from '.'
import HmppsAuthClient from '../data/hmppsAuthClient'
import MasApiClient from '../data/masApiClient'
import TokenStore from '../data/tokenStore/redisTokenStore'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import { toRoshWidget, toPredictors, isValidCrn, isNumericString, isValidUUID, setDataValue } from '../utils'
import { mockAppResponse } from './mocks'

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

const mockedIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>
const mockedIsValidUUID = isValidUUID as jest.MockedFunction<typeof isValidUUID>
const mockedIsNumberString = isNumericString as jest.MockedFunction<typeof isNumericString>
const mockedSetDataValue = setDataValue as jest.MockedFunction<typeof setDataValue>

jest.mock('uuid', () => ({
  v4: jest.fn(() => uuid),
}))

const req = httpMocks.createRequest({
  params: {
    crn,
    id: uuid,
  },
  query: {
    number,
  },
  session: {
    data: {
      appointments: {
        [crn]: {
          [uuid]: {
            type: 'type',
          },
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
})

const redirectSpy = jest.spyOn(res, 'redirect')
const statusSpy = jest.spyOn(res, 'status')
const renderSpy = jest.spyOn(res, 'render')

describe('controllers/arrangeAppointment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('redirectToType', () => {
    describe('CRN and UUID are valid in request params', () => {
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(true)
        await controllers.arrangeAppointments.redirectToType()(req, res)
      })
      it('should redirect to the type page', () => {
        expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/arrange-appointment/${uuid}/type`)
      })
    })
    describe('if CRN or UUID are invalid format in request params', () => {
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(false)
        mockedIsValidUUID.mockReturnValue(false)
        await controllers.arrangeAppointments.redirectToType()(req, res)
      })
      it('should return a status of 404 and render the error page', () => {
        expect(statusSpy).toHaveBeenCalledWith(404)
        expect(renderSpy).toHaveBeenCalledWith('pages/error', { message: 'Page not found' })
      })
      it('should not redirect to the type page', () => {
        expect(redirectSpy).not.toHaveBeenCalled()
      })
    })
  })
  //   describe('getOrPostType', () => {})
  //   describe('getType', () => {})
  describe('postType', () => {
    describe('CRN and UUID are valid in request params', () => {
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(true)
        mockedIsNumberString.mockReturnValue(true)
      })
      describe('If change url not in query', () => {
        beforeEach(async () => {
          await controllers.arrangeAppointments.postType()(req, res)
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
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(false)
        mockedIsValidUUID.mockReturnValue(true)
        mockedIsNumberString.mockReturnValue(true)
        await controllers.arrangeAppointments.postType()(req, res)
      })
      it('should return a status of 404 and render the error page', () => {
        expect(statusSpy).toHaveBeenCalledWith(404)
        expect(renderSpy).toHaveBeenCalledWith('pages/error', { message: 'Page not found' })
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
        expect(statusSpy).toHaveBeenCalledWith(404)
        expect(renderSpy).toHaveBeenCalledWith('pages/error', { message: 'Page not found' })
      })
    })
    describe('if number is invalid format in request params', () => {
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(true)
        mockedIsNumberString.mockReturnValue(false)
        await controllers.arrangeAppointments.postType()(req, res)
      })
      it('should return a status of 404 and render the error page', () => {
        expect(statusSpy).toHaveBeenCalledWith(404)
        expect(renderSpy).toHaveBeenCalledWith('pages/error', { message: 'Page not found' })
      })
    })
  })
  describe('getSentence', () => {
    describe('If type page has not been completed', () => {
      const mockReq = {
        ...req,
        session: {
          ...req.session,
          data: {
            ...req.session.data,
            appointments: {
              ...req.session.data.appointments,
              [crn]: {
                ...req.session.data.appointments[crn],
                [uuid]: {
                  ...req.session.data.appointments[crn][uuid],
                  type: null,
                },
              },
            },
          },
        },
      } as httpMocks.MockRequest<any>
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
        expect(statusSpy).toHaveBeenCalledWith(404)
        expect(renderSpy).toHaveBeenLastCalledWith('pages/error', { message: 'Page not found' })
      })
      it('if uuid is invalid in request params', async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(false)
        await controllers.arrangeAppointments.getSentence()(mockReq, res)
        expect(statusSpy).toHaveBeenCalledWith(404)
        expect(renderSpy).toHaveBeenLastCalledWith('pages/error', { message: 'Page not found' })
      })
    })
    describe('If type page has been completed', () => {
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(true)
        mockedIsValidUUID.mockReturnValue(true)
        await controllers.arrangeAppointments.getSentence()(req, res)
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
    it('should reset the sentence requirement value if sentence licence condition value in request body', async () => {
      const mockReq = {
        ...req,
        session: {
          data: {
            appointments: {
              [crn]: {
                [uuid]: {
                  'sentence-requirement': 'value',
                },
              },
            },
          },
        },
        body: {
          appointments: {
            [crn]: {
              [uuid]: {
                'sentence-licence-condition': 'value',
              },
            },
          },
        },
      } as httpMocks.MockRequest<any>
      await controllers.arrangeAppointments.postSentence()(mockReq, res)
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'sentence-requirement'],
        '',
      )
    })
    it('should reset the sentence licence condition value if sentence requirement value in request body', async () => {
      const mockReq = {
        ...req,
        session: {
          data: {
            appointments: {
              [crn]: {
                [uuid]: {
                  'sentence-licence-condition': 'value',
                },
              },
            },
          },
        },
        body: {
          appointments: {
            [crn]: {
              [uuid]: {
                'sentence-requirement': 'value',
              },
            },
          },
        },
      } as httpMocks.MockRequest<any>
      await controllers.arrangeAppointments.postSentence()(mockReq, res)
      expect(mockedSetDataValue).toHaveBeenCalledWith(
        mockReq.session.data,
        ['appointments', crn, uuid, 'sentence-licence-condition'],
        '',
      )
    })
  })
  //   describe('getLocation', () => {})
  //   describe('postLocation', () => {})
  //   describe('getLocationNotInList', () => {})
  //   describe('getDateTime', () => {})
  //   describe('postDateTime', () => {})
  //   describe('getRepeating', () => {})
  //   describe('postRepeating', () => {})
  //   describe('getPreview', () => {})
  //   describe('postPreview', () => {})
  //   describe('getCheckYourAnswers', () => {})
  //   describe('postCheckYourAnswers', () => {})
  //   describe('getConfirmation', () => {})
  //   describe('postConfirmation', () => {})
})
