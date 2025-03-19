import httpMocks from 'node-mocks-http'
import { Response } from 'superagent'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 as uuidv4 } from 'uuid'
import renders from '.'
import HmppsAuthClient from '../../data/hmppsAuthClient'
import TokenStore from '../../data/tokenStore/redisTokenStore'
import MasApiClient from '../../data/masApiClient'
import { ProfessionalContact } from '../../data/model/professionalContact'
import { AppResponse } from '../../@types'
import TierApiClient from '../../data/tierApiClient'
import ArnsApiClient from '../../data/arnsApiClient'
import { mockTierCalculation, mockRisks, mockPredictors } from './activityLog.test'
import { toRoshWidget, toPredictors } from '../../utils/utils'
import { PersonalContact, PersonalDetailsMainAddress } from '../../data/model/personalDetails'
import { AddressOverview, AddressOverviewSummary } from '../../data/model/common'

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'
const id = 'mock-id'
const noteId = 'mock-note-id'
const addressId = 'mock-address-id'
const documentId = 'mock-document-id'

const mockContacts = {
  name: {
    forename: 'Eula',
    middleName: '',
    surname: 'Schmeler',
  },
  currentContacts: [
    {
      name: 'Arhsimna Xolfo',
      email: 'arhsimna.xolfo@moj.gov.uk',
      telephoneNumber: '07321165373',
      provider: 'London',
      probationDeliveryUnit: 'All London',
      team: 'Unallocated Team (N07)',
      allocationDate: '2025-04-22',
      responsibleOfficer: true,
      prisonOffenderManager: false,
    },
  ],
  previousContacts: [
    {
      name: 'Yrhreender Hanandra',
      role: 'Community Offender Manager (COM)',
      email: 'yrhreender.hanandra@moj.gov.uk',
      telephoneNumber: '07321165373',
      provider: 'London',
      probationDeliveryUnit: 'All London',
      team: 'Unallocated Team (N07)',
      allocationDate: '2025-04-21',
      allocatedUntil: '2025-04-22',
      responsibleOfficer: false,
      prisonOffenderManager: false,
    },
  ],
} as unknown as ProfessionalContact

jest.mock('../../data/masApiClient')
jest.mock('../../data/arnsApiClient')
jest.mock('../../data/tokenStore/redisTokenStore')
jest.mock('@ministryofjustice/hmpps-audit-client')

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
}))

jest.mock('../../utils/utils', () => ({
  toRoshWidget: jest.fn(),
  toPredictors: jest.fn(),
}))

jest.mock('../../data/hmppsAuthClient', () => {
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
    addressId,
    documentId,
  },
  url: '/sentence',
})

const res = {
  locals: {
    user: {
      username: 'user-1',
    },
  },
  redirect: jest.fn().mockReturnThis(),
  render: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
} as unknown as AppResponse

const renderSpy = jest.spyOn(res, 'render')

const getContactsSpy = jest
  .spyOn(MasApiClient.prototype, 'getContacts')
  .mockImplementation(() => Promise.resolve(mockContacts))
const auditSpy = jest.spyOn(auditService, 'sendAuditMessage')
const tierCalculationSpy = jest
  .spyOn(TierApiClient.prototype, 'getCalculationDetails')
  .mockImplementation(() => Promise.resolve(mockTierCalculation))
const risksSpy = jest.spyOn(ArnsApiClient.prototype, 'getRisks').mockImplementation(() => Promise.resolve(mockRisks))
const predictorsSpy = jest
  .spyOn(ArnsApiClient.prototype, 'getPredictorsAll')
  .mockImplementation(() => Promise.resolve(mockPredictors))

const checkApiRequests = (): void => {
  it('should request tier calculation details from the api', () => {
    expect(tierCalculationSpy).toHaveBeenCalledWith(crn)
  })
  it('should request risks from the api', () => {
    expect(risksSpy).toHaveBeenCalledWith(crn)
  })
  it('should request predictors from the api', () => {
    expect(predictorsSpy).toHaveBeenCalledWith(crn)
  })
}

const checkAuditMessage = (action: string): void => {
  it('should send an audit message', () => {
    expect(auditSpy).toHaveBeenCalledWith({
      action,
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: uuidv4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })
  })
}

describe('/controllers/personalDetails', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('staffContacts', () => {
    beforeEach(async () => {
      await renders.personalDetailsController.staffContacts(hmppsAuthClient)(req, res)
    })
    checkAuditMessage('VIEW_MAS_SENTENCE_PROFESSIONAL_CONTACTS')
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
  describe('personalContact', () => {
    const mockPersonalContact = {} as unknown as PersonalContact
    const personalContactSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonalContact')
      .mockImplementation(() => Promise.resolve(mockPersonalContact))
    beforeEach(async () => {
      await renders.personalDetailsController.personalContact(hmppsAuthClient)(req, res)
    })
    checkAuditMessage('VIEW_MAS_PERSONAL_CONTACT')
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
  describe('personalContactNote', () => {
    const mockPersonalContactNote = {} as unknown as PersonalContact
    const personalContactNoteSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonalContactNote')
      .mockImplementation(() => Promise.resolve(mockPersonalContactNote))
    beforeEach(async () => {
      await renders.personalDetailsController.personalContactNote(hmppsAuthClient)(req, res)
    })
    checkAuditMessage('VIEW_MAS_PERSONAL_CONTACT_NOTE')
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
  describe('mainAddressNote', () => {
    const mockMainAddressNote = {} as unknown as PersonalDetailsMainAddress
    const mainAddressNoteSpy = jest
      .spyOn(MasApiClient.prototype, 'getMainAddressNote')
      .mockImplementation(() => Promise.resolve(mockMainAddressNote))
    beforeEach(async () => {
      await renders.personalDetailsController.mainAddressNote(hmppsAuthClient)(req, res)
    })
    checkAuditMessage('VIEW_MAS_PERSONAL_CONTACT_NOTE')
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
  describe('addresses', () => {
    const mockPersonalAddresses = {} as unknown as AddressOverview
    const personalAddressesSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonalAddresses')
      .mockImplementation(() => Promise.resolve(mockPersonalAddresses))
    beforeEach(async () => {
      await renders.personalDetailsController.addresses(hmppsAuthClient)(req, res)
    })
    checkAuditMessage('VIEW_MAS_VIEW_ALL_ADDRESSES')
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
  describe('addressesNote', () => {
    const mockAddressesNote = {} as unknown as AddressOverviewSummary
    const addressesNoteSpy = jest
      .spyOn(MasApiClient.prototype, 'getPersonalAddressesNote')
      .mockImplementation(() => Promise.resolve(mockAddressesNote))
    beforeEach(async () => {
      await renders.personalDetailsController.addressesNote(hmppsAuthClient)(req, res)
    })
    checkAuditMessage('VIEW_MAS_VIEW_ALL_ADDRESSES_NOTE')
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
  describe('documentsDownload', () => {
    const mockDownloadResponse = { headers: {}, body: {} } as unknown as Response
    const downloadDocumentSpy = jest
      .spyOn(MasApiClient.prototype, 'downloadDocument')
      .mockImplementation(() => Promise.resolve(mockDownloadResponse))
    const setSpy = jest.spyOn(res, 'set')
    const sendSpy = jest.spyOn(res, 'send')
    beforeEach(async () => {
      await renders.personalDetailsController.documentsDownload(hmppsAuthClient)(req, res)
    })
    checkAuditMessage('VIEW_MAS_DOWNLOAD_DOCUMENT')
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
})
