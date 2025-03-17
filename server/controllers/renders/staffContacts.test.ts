import httpMocks from 'node-mocks-http'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { v4 as uuidv4 } from 'uuid'

import renders from '.'
import HmppsAuthClient from '../../data/hmppsAuthClient'
import TokenStore from '../../data/tokenStore/redisTokenStore'
import MasApiClient from '../../data/masApiClient'
import { ProfessionalContact } from '../../data/model/professionalContact'

const token = { access_token: 'token-1', expires_in: 300 }
const tokenStore = new TokenStore(null) as jest.Mocked<TokenStore>
const crn = 'X000001'

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
jest.mock('../../data/tokenStore/redisTokenStore')
jest.mock('@ministryofjustice/hmpps-audit-client')

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'f1654ea3-0abb-46eb-860b-654a96edbe20'),
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
  },
  url: '/sentence',
})

const res = httpMocks.createResponse({
  locals: {
    user: {
      username: 'USER1',
    },
  },
})

const renderSpy = jest.spyOn(res, 'render')

const getContactsSpy = jest
  .spyOn(MasApiClient.prototype, 'getContacts')
  .mockImplementation(() => Promise.resolve(mockContacts))

describe('/controllers/staffContacts', () => {
  const auditSpy = jest.spyOn(auditService, 'sendAuditMessage')
  beforeEach(async () => {
    await renders.staffContacts(hmppsAuthClient)(req, res)
  })
  it('should send an audit message', () => {
    expect(auditSpy).toHaveBeenCalledWith({
      action: 'VIEW_MAS_SENTENCE_PROFESSIONAL_CONTACTS',
      who: res.locals.user.username,
      subjectId: crn,
      subjectType: 'CRN',
      correlationId: uuidv4(),
      service: 'hmpps-manage-people-on-probation-ui',
    })
  })
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
