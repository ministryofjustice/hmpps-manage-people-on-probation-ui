import httpMocks from 'node-mocks-http'
import { Response } from 'superagent'
import { v4 as uuidv4 } from 'uuid'
import HmppsAuthClient from '../data/hmppsAuthClient'
import RoleService from '../services/roleService'
import TokenStore from '../data/tokenStore/redisTokenStore'
import MasApiClient from '../data/masApiClient'
import TierApiClient from '../data/tierApiClient'
import ArnsApiClient from '../data/arnsApiClient'
import {
  mockTierCalculation,
  mockRisks,
  mockPredictors,
  mockContacts,
  mockAppResponse,
  mockSanIndicatorResponse,
} from './mocks'
import { toRoshWidget, toPredictors, isValidCrn } from '../utils'
import * as validationUtils from '../utils/validationUtils'
import { renderError } from '../middleware'
import {
  CircumstanceOverview,
  DisabilityOverview,
  PersonalContact,
  PersonalDetails,
  PersonalDetailsMainAddress,
  ProvisionOverview,
  AddressOverview,
  AddressOverviewSummary,
  PersonSummary,
} from '../data/model/personalDetails'
import controllers from '.'
import { checkAuditMessage } from './testutils'
import { Needs } from '../data/model/risk'

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const id = 'mock-id'
const noteId = 'mock-note-id'
const addressId = 'mock-address-id'
const documentId = 'mock-document-id'
const disabilityId = 'mock-disability-id'
const adjustmentId = 'mock-adjustment-id'
const circumstanceId = 'mock-circumstance-id'

jest.mock('../data/masApiClient')
jest.mock('../data/arnsApiClient')
jest.mock('../services/roleService')
jest.mock('../data/tokenStore/redisTokenStore')
jest.mock('@ministryofjustice/hmpps-audit-client')

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))

jest.mock('../utils', () => ({
  toRoshWidget: jest.fn(),
  toPredictors: jest.fn(),
  toIsoDateFromPicker: jest.fn().mockImplementation(() => '2025-03-12'),
  isValidCrn: jest.fn(),
}))

const mockMiddlewareFn = jest.fn()
jest.mock('../middleware', () => ({
  renderError: jest.fn(() => mockMiddlewareFn),
}))

const mockRenderError = renderError as jest.MockedFunction<typeof renderError>
const mockedIsValidCrn = isValidCrn as jest.MockedFunction<typeof isValidCrn>

jest.mock('../utils/validationUtils', () => ({
  validateWithSpec: jest.fn(),
}))

jest.mock('../data/hmppsAuthClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      getSystemClientToken: jest.fn().mockImplementation(() => Promise.resolve('token-1')),
    }
  })
})

const hmppsAuthClient = new HmppsAuthClient(null) as jest.Mocked<HmppsAuthClient>
tokenStore.getToken.mockResolvedValue(token.access_token)

const req = httpMocks.createRequest({
  params: {
    crn,
    id,
    noteId,
    disabilityId,
    addressId,
    documentId,
    circumstanceId,
    adjustmentId,
    system: 'mockSystem',
  },
  url: '/sentence',
})

const res = mockAppResponse()

const renderSpy = jest.spyOn(res, 'render')
const redirectSpy = jest.spyOn(res, 'redirect')

const getContactsSpy = jest
  .spyOn(MasApiClient.prototype, 'getContacts')
  .mockImplementation(() => Promise.resolve(mockContacts))

const tierCalculationSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))
const risksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))
const predictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))
const getSanIndicatorSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getSanIndicator')
  .mockImplementation(() => Promise.resolve(mockSanIndicatorResponse))
const mockPersonalDetails = {} as PersonalDetails
const mockNeeds = {} as Needs
const getPersonalDetailsSpy = jest
  .spyOn(MasApiClient.prototype, 'getPersonalDetails')
  .mockImplementation(() => Promise.resolve(mockPersonalDetails))
const getNeedsSpy = jest.spyOn(ArnsApiClient.prototype, 'getNeeds').mockImplementation(() => Promise.resolve(mockNeeds))

const checkApiRequests = (sanIndicator = false): void => {
  it('should request tier calculation details from the api', () => {
    expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
  })
  it('should request risks from the api', () => {
    expect(risksSpy).toHaveBeenCalledWith(crn)
  })
  it('should request predictors from the api', () => {
    expect(predictorsSpy).toHaveBeenCalledWith(crn)
  })
  if (sanIndicator) {
    it('should request the san indicator from the api', () => {
      expect(getSanIndicatorSpy).toHaveBeenCalledWith(crn)
    })
  }
}

describe('/controllers/personalDetails', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('getPersonalDetails', () => {
    describe('Requested page is edit contact details', () => {
      const mockReq = {
        ...req,
        query: {
          ...req.query,
          update: true,
        },
        path: 'personal-details/edit-contact-details',
      } as httpMocks.MockRequest<any>

      describe('If user does not have access', () => {
        beforeEach(async () => {
          mockedIsValidCrn.mockReturnValue(true)
          jest.spyOn(RoleService.prototype, 'hasAccess').mockImplementation(() => Promise.resolve(false))
          await controllers.personalDetails.getPersonalDetails(hmppsAuthClient)(mockReq, res)
        })
        it('should redirect to the no authorisation error page', () => {
          expect(redirectSpy).toHaveBeenCalledWith(`/no-perm-autherror?backLink=/case/${crn}/personal-details`)
        })
      })
      describe('If user has access', () => {
        beforeEach(async () => {
          mockedIsValidCrn.mockReturnValue(true)
          jest.spyOn(RoleService.prototype, 'hasAccess').mockImplementation(() => Promise.resolve(true))
          await controllers.personalDetails.getPersonalDetails(hmppsAuthClient)(mockReq, res)
        })
        checkAuditMessage(res, 'VIEW_EDIT_PERSONAL_DETAILS', uuidv4(), crn, 'CRN')
        const sanIndicator = true
        checkApiRequests(sanIndicator)

        it('should render the main address page', () => {
          expect(renderSpy).toHaveBeenCalledWith('pages/edit-contact-details/edit-contact-details', {
            personalDetails: mockPersonalDetails,
            needs: mockNeeds,
            tierCalculation: mockTierCalculation,
            crn,
            risksWidget: toRoshWidget(mockRisks),
            predictorScores: toPredictors(mockPredictors),
            success: true,
            backLink: `/case/${crn}/personal-details`,
            hidePageHeader: true,
            manageUsersAccess: true,
            sanIndicator: true,
          })
        })
      })
      describe('CRN in url parameter is not valid', () => {
        const statusSpy = jest.spyOn(res, 'status')
        beforeEach(async () => {
          mockedIsValidCrn.mockReturnValue(false)
          jest.spyOn(RoleService.prototype, 'hasAccess').mockImplementation(() => Promise.resolve(true))
          await controllers.personalDetails.getPersonalDetails(hmppsAuthClient)(mockReq, res)
        })
        it('should return a 404 status and render the error page', () => {
          expect(mockRenderError).toHaveBeenCalledWith(404)
          expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
        })
      })
    })
    describe('Requested page is edit main address', () => {
      const mockReq = {
        ...req,
        query: {
          ...req.query,
          update: true,
        },
        path: 'personal-details/edit-main-address',
      } as httpMocks.MockRequest<any>
      describe('If user does not have access', () => {
        beforeEach(async () => {
          mockedIsValidCrn.mockReturnValue(true)
          jest.spyOn(RoleService.prototype, 'hasAccess').mockImplementation(() => Promise.resolve(false))
          await controllers.personalDetails.getPersonalDetails(hmppsAuthClient)(mockReq, res)
        })
        it('should redirect to the no authorisation error page', () => {
          expect(redirectSpy).toHaveBeenCalledWith(`/no-perm-autherror?backLink=/case/${crn}/personal-details`)
        })
      })
      describe('If user has access', () => {
        beforeEach(async () => {
          mockedIsValidCrn.mockReturnValue(true)
          jest.spyOn(RoleService.prototype, 'hasAccess').mockImplementation(() => Promise.resolve(true))
          await controllers.personalDetails.getPersonalDetails(hmppsAuthClient)(mockReq, res)
        })
        checkAuditMessage(res, 'VIEW_EDIT_MAIN_ADDRESS', uuidv4(), crn, 'CRN')
        it('should render the main address page', () => {
          expect(renderSpy).toHaveBeenCalledWith('pages/edit-contact-details/edit-main-address', {
            personalDetails: mockPersonalDetails,
            needs: mockNeeds,
            tierCalculation: mockTierCalculation,
            crn,
            risksWidget: toRoshWidget(mockRisks),
            predictorScores: toPredictors(mockPredictors),
            success: true,
            backLink: `/case/${crn}/personal-details`,
            hidePageHeader: true,
            manageUsersAccess: true,
            sanIndicator: true,
          })
        })
      })
    })
  })
  describe('postEditDetails', () => {
    const mainAddressBody = {
      ...req.body,
      noFixedAddress: 'false',
      buildingName: 'Building name',
      buildingNumber: '10',
      streetName: 'Some street',
      district: 'District',
      town: 'Some town',
      county: 'Country',
      postcode: 'LS12 4PP',
      addressTypeCode: '',
      verified: 'true',
      startDate: '11/02/2025',
      endDate: '11/03/2025',
      typeCode: '',
      notes: 'Some notes',
      _csrf: '1234',
    }

    const { buildingName, buildingNumber, county, district, notes, streetName, town, typeCode, postcode } =
      mainAddressBody

    const contactDetailsBody = {
      phoneNumber: '07882 458594',
      mobileNumber: '07882 458594',
      emailAddress: 'first.last@digital.justice.gov.uk',
      _csrf: '1234',
    }

    describe('Edit main address', () => {
      describe('form is invalid', () => {
        const mockReq = {
          ...req,
          query: {
            ...req.query,
          },
          body: {
            ...req.body,
            ...mainAddressBody,
            postcode: '',
          },
          path: 'personal-details/edit-main-address',
        } as httpMocks.MockRequest<any>
        beforeEach(async () => {
          mockedIsValidCrn.mockReturnValue(true)
          jest.spyOn(validationUtils, 'validateWithSpec').mockImplementation(() => ({
            error: 'Error',
          }))
          await controllers.personalDetails.postEditDetails(hmppsAuthClient)(mockReq, res)
        })
        checkAuditMessage(res, 'SAVE_EDIT_MAIN_ADDRESS', uuidv4(), crn, 'CRN')
        it('should request the page data from the api', () => {
          expect(getPersonalDetailsSpy).toHaveBeenCalledWith(crn)
          expect(risksSpy).toHaveBeenCalledWith(crn)
          expect(getNeedsSpy).toHaveBeenCalledWith(crn)
          expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
          expect(predictorsSpy).toHaveBeenCalledWith(crn)
        })
        it('should re-render the edit main address page', () => {
          expect(renderSpy).toHaveBeenCalledWith(`pages/edit-contact-details/edit-main-address`, {
            personalDetails: {
              mainAddress: {
                buildingName,
                buildingNumber,
                county,
                district,
                from: '11/02/2025',
                to: '11/03/2025',
                noFixedAddress: false,
                notes,
                streetName,
                town,
                typeCode,
                postcode: '',
                verified: true,
              },
            },
            needs: mockNeeds,
            tierCalculation: mockTierCalculation,
            crn,
            risksWidget: toRoshWidget(mockRisks),
            predictorScores: toPredictors(mockPredictors),
            hidePageHeader: true,
            backLink: `/case/${crn}/personal-details`,
          })
        })
      })
      describe('form is valid', () => {
        const updatePersonalDetailsAddressSpy = jest.spyOn(MasApiClient.prototype, 'updatePersonalDetailsAddress')
        const mockReq = {
          ...req,
          query: {
            ...req.query,
          },
          body: {
            ...req.body,
            ...mainAddressBody,
            endDateWarningDisplayed: true,
          },
          path: 'personal-details/edit-main-address',
        } as httpMocks.MockRequest<any>
        beforeEach(async () => {
          jest.spyOn(validationUtils, 'validateWithSpec').mockImplementation(() => ({}))
          await controllers.personalDetails.postEditDetails(hmppsAuthClient)(mockReq, res)
        })
        checkAuditMessage(res, 'SAVE_EDIT_MAIN_ADDRESS', uuidv4(), crn, 'CRN')
        it('should update the main address', () => {
          expect(updatePersonalDetailsAddressSpy).toHaveBeenCalledWith(crn, {
            addressTypeCode: '',
            startDate: '2025-03-12',
            endDate: '2025-03-12',
            noFixedAddress: false,
            buildingName,
            buildingNumber,
            streetName,
            district,
            town,
            county,
            postcode,
            verified: true,
            endDateWarningDisplayed: true,
            typeCode: '',
            notes,
          })
        })
        it('should redirect to the personal details url with update=success query param', () => {
          expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/personal-details?update=success`)
        })
      })
    })
    describe('CRN in url params is invalid', () => {
      const mockReq = {
        ...req,
        query: {
          ...req.query,
        },
        body: {
          ...req.body,
          ...mainAddressBody,
          endDateWarningDisplayed: true,
        },
        path: 'personal-details/edit-main-address',
      } as httpMocks.MockRequest<any>
      beforeEach(async () => {
        mockedIsValidCrn.mockReturnValue(false)
        jest.spyOn(validationUtils, 'validateWithSpec').mockImplementation(() => ({}))
        await controllers.personalDetails.postEditDetails(hmppsAuthClient)(mockReq, res)
      })
      it('should return a 404 status and render the error page', () => {
        expect(mockRenderError).toHaveBeenCalledWith(404)
        expect(mockMiddlewareFn).toHaveBeenCalledWith(mockReq, res)
      })
    })
    describe('Edit contact details', () => {
      const { phoneNumber, mobileNumber, emailAddress: email } = contactDetailsBody
      describe('form is invalid', () => {
        const mockReq = {
          ...req,
          query: {
            ...req.query,
          },
          body: {
            ...req.body,
            ...contactDetailsBody,
            phoneNumber: '',
            _csrf: '1234',
          },
          path: 'personal-details/edit-contact-details',
        } as httpMocks.MockRequest<any>
        beforeEach(async () => {
          jest.spyOn(validationUtils, 'validateWithSpec').mockImplementation(() => ({
            error: 'Error',
          }))
          await controllers.personalDetails.postEditDetails(hmppsAuthClient)(mockReq, res)
        })
        checkAuditMessage(res, 'SAVE_EDIT_PERSONAL_DETAILS', uuidv4(), crn, 'CRN')
        it('should request the page data from the api', () => {
          expect(getPersonalDetailsSpy).toHaveBeenCalledWith(crn)
          expect(risksSpy).toHaveBeenCalledWith(crn)
          expect(getNeedsSpy).toHaveBeenCalledWith(crn)
          expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
          expect(predictorsSpy).toHaveBeenCalledWith(crn)
        })
        it('should re-render the edit contact details page', () => {
          expect(renderSpy).toHaveBeenCalledWith(`pages/edit-contact-details/edit-contact-details`, {
            personalDetails: {
              telephoneNumber: '',
              mobileNumber,
              email,
            },
            needs: mockNeeds,
            tierCalculation: mockTierCalculation,
            crn,
            risksWidget: toRoshWidget(mockRisks),
            predictorScores: toPredictors(mockPredictors),
            hidePageHeader: true,
            backLink: `/case/${crn}/personal-details`,
          })
        })
      })
      describe('Form is valid', () => {
        const updatePersonalDetailsContactSpy = jest.spyOn(MasApiClient.prototype, 'updatePersonalDetailsContact')
        const mockReq = {
          ...req,
          query: {
            ...req.query,
          },
          body: {
            ...req.body,
            ...contactDetailsBody,
            _csrf: '1234',
          },
          path: 'personal-details/edit-contact-details',
        } as httpMocks.MockRequest<any>
        beforeEach(async () => {
          jest.spyOn(validationUtils, 'validateWithSpec').mockImplementation(() => ({}))
          await controllers.personalDetails.postEditDetails(hmppsAuthClient)(mockReq, res)
        })
        checkAuditMessage(res, 'SAVE_EDIT_PERSONAL_DETAILS', uuidv4(), crn, 'CRN')
        it('should update the personal details', () => {
          const { emailAddress } = contactDetailsBody
          expect(updatePersonalDetailsContactSpy).toHaveBeenCalledWith(crn, {
            phoneNumber,
            mobileNumber,
            emailAddress,
          })
        })
        it('should redirect to the personal details url with update=success query param', () => {
          expect(redirectSpy).toHaveBeenCalledWith(`/case/${crn}/personal-details?update=success`)
        })
      })
    })
  })
  describe('getStaffContacts', () => {
    beforeEach(async () => {
      await controllers.personalDetails.getStaffContacts(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_SENTENCE_PROFESSIONAL_CONTACTS', uuidv4(), crn, 'CRN')
    it('should request the contacts from the api', () => {
      expect(getContactsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the staff contact page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/staff-contacts', {
        professionalContact: mockContacts,
        previousContacts: mockContacts.previousContacts,
        currentContacts: mockContacts.currentContacts,
        isSentenceJourney: true,
        crn,
      })
    })
  })
  describe('getPersonalContact', () => {
    const mockPersonalContact = {} as unknown as PersonalContact
    const personalContactSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonalContact')
      .mockImplementation(() => Promise.resolve(mockPersonalContact))
    beforeEach(async () => {
      await controllers.personalDetails.getPersonalContact(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_PERSONAL_CONTACT', uuidv4(), crn, 'CRN')
    it('should request personal contact from the api', () => {
      expect(personalContactSpy).toHaveBeenCalledWith(crn, id)
    })
    checkApiRequests()
    it('should render the contact page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/personal-details/contact', {
        personalContact: mockPersonalContact,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
      })
    })
  })
  describe('getPersonalContactNote', () => {
    const mockPersonalContactNote = {} as unknown as PersonalContact
    const personalContactNoteSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonalContactNote')
      .mockImplementation(() => Promise.resolve(mockPersonalContactNote))
    beforeEach(async () => {
      await controllers.personalDetails.getPersonalContactNote(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_PERSONAL_CONTACT_NOTE', uuidv4(), crn, 'CRN')
    it('should request the data from the api', () => {
      expect(personalContactNoteSpy).toHaveBeenCalledWith(crn, id, noteId)
    })
    checkApiRequests()
    it('should render the contact page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/personal-details/contact/contact-note', {
        personalContact: mockPersonalContactNote,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
      })
    })
  })
  describe('getMainAddressNote', () => {
    const mockMainAddressNote = {} as unknown as PersonalDetailsMainAddress
    const mainAddressNoteSpy = jest
      .spyOn(MasApiClient.prototype, 'getMainAddressNote')
      .mockImplementation(() => Promise.resolve(mockMainAddressNote))
    beforeEach(async () => {
      await controllers.personalDetails.getMainAddressNote(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_PERSONAL_CONTACT_NOTE', uuidv4(), crn, 'CRN')
    it('should request the data from the api', () => {
      expect(mainAddressNoteSpy).toHaveBeenCalledWith(crn, noteId)
    })
    checkApiRequests()
    it('should render the main address note page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/personal-details/main-address/address-note', {
        personalDetails: mockMainAddressNote,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
      })
    })
  })
  describe('getAddresses', () => {
    const mockPersonalAddresses = {} as unknown as AddressOverview
    const personalAddressesSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonalAddresses')
      .mockImplementation(() => Promise.resolve(mockPersonalAddresses))
    beforeEach(async () => {
      await controllers.personalDetails.getAddresses(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_VIEW_ALL_ADDRESSES', uuidv4(), crn, 'CRN')
    it('should request the data from the api', () => {
      expect(personalAddressesSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the main address note page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/personal-details/addresses', {
        addressOverview: mockPersonalAddresses,
        crn,
      })
    })
  })
  describe('getAddressesNote', () => {
    const mockAddressesNote = {} as unknown as AddressOverviewSummary
    const addressesNoteSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonalAddressesNote')
      .mockImplementation(() => Promise.resolve(mockAddressesNote))
    beforeEach(async () => {
      await controllers.personalDetails.getAddressesNote(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_VIEW_ALL_ADDRESSES_NOTE', uuidv4(), crn, 'CRN')
    it('should request the data from the api', () => {
      expect(addressesNoteSpy).toHaveBeenCalledWith(crn, addressId, noteId)
    })
    checkApiRequests()
    it('should render the address note page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/personal-details/addresses/address-note', {
        addressOverview: mockAddressesNote,
        tierCalculation: mockTierCalculation,
        crn,
        risksWidget: toRoshWidget(mockRisks),
        predictorScores: toPredictors(mockPredictors),
      })
    })
  })
  describe('getDocumentsDownload', () => {
    const mockDownloadResponse = { headers: {}, body: {} } as unknown as Response
    const downloadDocumentSpy = jest
      .spyOn(MasApiClient.prototype, 'downloadDocument')
      .mockImplementation(() => Promise.resolve(mockDownloadResponse))
    const setSpy = jest.spyOn(res, 'set')
    const sendSpy = jest.spyOn(res, 'send')
    beforeEach(async () => {
      await controllers.personalDetails.getDocumentsDownload(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_DOWNLOAD_DOCUMENT', uuidv4(), crn, 'CRN')
    it('should request the download from the api', () => {
      expect(downloadDocumentSpy).toHaveBeenCalledWith(crn, documentId)
    })
    it('should set the response headers', () => {
      expect(setSpy).toHaveBeenCalledWith(mockDownloadResponse.headers)
    })
    it('should send the response body', () => {
      expect(sendSpy).toHaveBeenLastCalledWith(mockDownloadResponse.body)
    })
  })
  describe('getHandoff', () => {
    const personSummaryMock = {} as PersonSummary
    const getPersonSummarySpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonSummary')
      .mockImplementation(() => Promise.resolve(personSummaryMock))
    beforeEach(async () => {
      await controllers.personalDetails.getHandoff(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_HANDOFF_MOCKSYSTEM', uuidv4(), crn, 'CRN')
    it('should request person summary from the api', () => {
      expect(getPersonSummarySpy).toHaveBeenCalledWith(crn)
    })
    it('should render the handoff system page', () => {
      expect(renderSpy).toHaveBeenCalledWith(`pages/handoff/${req.params.system}`, {
        personSummary: personSummaryMock,
        crn,
      })
    })
  })
  describe('getDisabilities', () => {
    const personDisabilitiesMock = {} as DisabilityOverview
    const getPersonDisabilitiesSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonDisabilities')
      .mockImplementation(() => Promise.resolve(personDisabilitiesMock))
    beforeEach(async () => {
      await controllers.personalDetails.getDisabilities(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_DISABILITIES', uuidv4(), crn, 'CRN')
    it('should request person disabilities from the api', () => {
      expect(getPersonDisabilitiesSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the disabilities page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/personal-details/disabilities', {
        disabilities: personDisabilitiesMock,
        crn,
      })
    })
  })
  describe('getDisabilitiesNote', () => {
    const personDisabilityNoteMock = {} as DisabilityOverview
    const getPersonDisabilityNoteSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonDisabilityNote')
      .mockImplementation(() => Promise.resolve(personDisabilityNoteMock))
    beforeEach(async () => {
      await controllers.personalDetails.getDisabilitiesNote(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_DISABILITY_NOTE', uuidv4(), crn, 'CRN')
    it('should request person disability note from the api', () => {
      expect(getPersonDisabilityNoteSpy).toHaveBeenCalledWith(crn, disabilityId, noteId)
    })
    it('should render the disability note page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/personal-details/disabilities/disability-note', {
        disabilityOverview: personDisabilityNoteMock,
        crn,
      })
    })
  })
  describe('getAdjustments', () => {
    const personAdjustmentsMock = {} as ProvisionOverview
    const getPersonAdjustmentsSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonAdjustments')
      .mockImplementation(() => Promise.resolve(personAdjustmentsMock))
    beforeEach(async () => {
      await controllers.personalDetails.getAdjustments(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_ADJUSTMENTS', uuidv4(), crn, 'CRN')
    it('should request person adjustments from the api', () => {
      expect(getPersonAdjustmentsSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the adjustments page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/personal-details/adjustments', {
        adjustments: personAdjustmentsMock,
        crn,
      })
    })
  })
  describe('getAdjustmentsNote', () => {
    const personAdjustmentNoteMock = {} as ProvisionOverview
    const getPersonAdjustmentNoteSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonAdjustmentNote')
      .mockImplementation(() => Promise.resolve(personAdjustmentNoteMock))
    beforeEach(async () => {
      await controllers.personalDetails.getAdjustmentsNote(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_VIEW_ALL_ADJUSTMENT_NOTE', uuidv4(), crn, 'CRN')
    it('should request the adjustment note from the api', () => {
      expect(getPersonAdjustmentNoteSpy).toHaveBeenCalledWith(crn, adjustmentId, noteId)
    })
    it('should render the adjustment note page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/personal-details/adjustments/adjustment-note', {
        adjustmentOverview: personAdjustmentNoteMock,
        crn,
      })
    })
  })
  describe('getCircumstances', () => {
    const personCircumstancesMock = {} as CircumstanceOverview
    const getPersonCircumstancesSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonCircumstances')
      .mockImplementation(() => Promise.resolve(personCircumstancesMock))
    beforeEach(async () => {
      await controllers.personalDetails.getCircumstances(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_CIRCUMSTANCES', uuidv4(), crn, 'CRN')
    it('should request the circumstances from the api', () => {
      expect(getPersonCircumstancesSpy).toHaveBeenCalledWith(crn)
    })
    it('should render the circumstances page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/personal-details/circumstances', {
        circumstances: personCircumstancesMock,
        crn,
      })
    })
  })
  describe('getCircumstancesNote', () => {
    const personCircumstanceNoteMock = {} as CircumstanceOverview
    const getPersonCircumstanceNoteSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonCircumstanceNote')
      .mockImplementation(() => Promise.resolve(personCircumstanceNoteMock))
    beforeEach(async () => {
      await controllers.personalDetails.getCircumstancesNote(hmppsAuthClient)(req, res)
    })
    checkAuditMessage(res, 'VIEW_MAS_VIEW_ALL_CIRCUMSTANCE_NOTE', uuidv4(), crn, 'CRN')
    it('should request the circumstances from the api', () => {
      expect(getPersonCircumstanceNoteSpy).toHaveBeenCalledWith(crn, circumstanceId, noteId)
    })
    it('should render the circumstances page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/personal-details/circumstances/circumstance-note', {
        circumstanceOverview: personCircumstanceNoteMock,
        crn,
      })
    })
  })
})
