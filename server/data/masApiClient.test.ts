import nock from 'nock'

import config from '../config'
import { isValidHost, isValidPath } from '../utils'
import MasApiClient from './masApiClient'

jest.mock('../utils', () => {
  const actualUtils = jest.requireActual('../utils')
  return {
    ...actualUtils,
    isValidPath: jest.fn(),
    isValidHost: jest.fn(),
  }
})
const mockedIsValidHost = isValidHost as jest.MockedFunction<typeof isValidHost>
const mockedIsValidPath = isValidPath as jest.MockedFunction<typeof isValidPath>

jest.mock('./tokenStore/redisTokenStore')

const token = { access_token: 'token-1', expires_in: 300 }

describe('masApiClient', () => {
  let fakeMasApiClient: nock.Scope
  let masApiClient: MasApiClient

  beforeEach(() => {
    jest.clearAllMocks()
    fakeMasApiClient = nock(config.apis.masApi.url)
    masApiClient = new MasApiClient(token.access_token)
  })
  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })
  describe('getSentenceDetails', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockedIsValidHost.mockReturnValue(true)
      mockedIsValidPath.mockReturnValue(true)
    })
    fakeMasApiClient = nock(config.apis.masApi.url)
    masApiClient = new MasApiClient(token.access_token)

    it.each([
      ['getOverview', '/overview/X000001?sentenceNumber=1', () => masApiClient.getOverview('X000001')],
      ['getSentenceDetails', '/sentence/X000001', () => masApiClient.getSentenceDetails('X000001')],
      ['getSentences', '/sentences/X000001', () => masApiClient.getSentences('X000001')],
      ['getSentences', '/sentences/X000001?number=2', () => masApiClient.getSentences('X000001', '2')],
      ['getProbationHistory', '/sentence/X000001/probation-history', () => masApiClient.getProbationHistory('X000001')],
      [
        'getSentencePreviousOrders',
        '/sentence/X000001/previous-orders',
        () => masApiClient.getSentencePreviousOrders('X000001'),
      ],
      [
        'getSentencePreviousOrder',
        '/sentence/X000001/previous-orders/1',
        () => masApiClient.getSentencePreviousOrder('X000001', '1'),
      ],
      ['getSentenceOffences', '/sentence/X000001/offences/1', () => masApiClient.getSentenceOffences('X000001', '1')],
      [
        'getSentenceLicenceConditionNote',
        '/sentence/X000001/licence-condition/1/note/2',
        () => masApiClient.getSentenceLicenceConditionNote('X000001', '1', '2'),
      ],
      [
        'getSentenceRequirementNote',
        '/sentence/X000001/requirement/1/note/2',
        () => masApiClient.getSentenceRequirementNote('X000001', '1', '2'),
      ],
      ['getContacts', '/sentence/X000001/contacts', () => masApiClient.getContacts('X000001')],
      ['getPersonalDetails', '/personal-details/X000001', () => masApiClient.getPersonalDetails('X000001')],
      [
        'updatePersonalDetailsContact',
        '/personal-details/X000001/contact',
        () => masApiClient.updatePersonalDetailsContact('X000001', {}),
        'post',
      ],
      [
        'updatePersonalDetailsAddress',
        '/personal-details/X000001/address',
        () => masApiClient.updatePersonalDetailsAddress('X000001', {}),
        'post',
      ],
      [
        'getPersonalContact',
        '/personal-details/X000001/personal-contact/2',
        () => masApiClient.getPersonalContact('X000001', '2'),
      ],
      [
        'getPersonalContactNote',
        '/personal-details/X000001/personal-contact/2/note/3',
        () => masApiClient.getPersonalContactNote('X000001', '2', '3'),
      ],
      [
        'getMainAddressNote',
        '/personal-details/X000001/main-address/note/2',
        () => masApiClient.getMainAddressNote('X000001', '2'),
      ],
      [
        'getPersonalAddresses',
        '/personal-details/X000001/addresses',
        () => masApiClient.getPersonalAddresses('X000001'),
      ],
      [
        'getPersonalAddressesNote',
        '/personal-details/X000001/addresses/1/note/2',
        () => masApiClient.getPersonalAddressesNote('X000001', '1', '2'),
      ],
      ['getPersonSummary', '/personal-details/X000001/summary', () => masApiClient.getPersonSummary('X000001')],
      [
        'getPersonDisabilities',
        '/personal-details/X000001/disabilities',
        () => masApiClient.getPersonDisabilities('X000001'),
      ],
      [
        'getPersonDisabilityNote',
        '/personal-details/X000001/disability/1/note/2',
        () => masApiClient.getPersonDisabilityNote('X000001', '1', '2'),
      ],
      [
        'getPersonAdjustments',
        '/personal-details/X000001/provisions',
        () => masApiClient.getPersonAdjustments('X000001'),
      ],
      [
        'getPersonAdjustmentNote',
        '/personal-details/X000001/provisions/1/note/2',
        () => masApiClient.getPersonAdjustmentNote('X000001', '1', '2'),
      ],
      [
        'getPersonCircumstances',
        '/personal-details/X000001/circumstances',
        () => masApiClient.getPersonCircumstances('X000001'),
      ],
      [
        'getPersonCircumstanceNote',
        '/personal-details/X000001/circumstances/1/note/2',
        () => masApiClient.getPersonCircumstanceNote('X000001', '1', '2'),
      ],
      [
        'downloadDocument',
        '/personal-details/X000001/document/1',
        () => masApiClient.downloadDocument('X000001', '1'),
        'get',
        true,
      ],
      ['getPersonSchedule', '/schedule/X000001/1', () => masApiClient.getPersonSchedule('X000001', '1')],
      [
        'getPersonAppointment',
        '/schedule/X000001/appointment/1',
        () => masApiClient.getPersonAppointment('X000001', '1'),
      ],
      [
        'getPersonAppointmentNote',
        '/schedule/X000001/appointment/1/note/2',
        () => masApiClient.getPersonAppointmentNote('X000001', '1', '2'),
      ],
      [
        'getPersonAppointmentNote',
        '/schedule/X000001/appointment/1/note/2',
        () => masApiClient.getPersonAppointmentNote('X000001', '1', '2'),
      ],
      [
        'postPersonActivityLog',
        '/activity/X000001?size=10&page=1',
        () =>
          masApiClient.postPersonActivityLog('X000001', { keywords: '', dateFrom: '', dateTo: '', filters: [] }, '1'),
        'post',
      ],
      ['getPersonRiskFlags', '/risk-flags/X000001', () => masApiClient.getPersonRiskFlags('X000001')],
      [
        'getDocuments',
        '/documents/X000001?size=15&page=1&sortBy=createdAt.desc',
        () => masApiClient.getDocuments('X000001', '1', 'createdAt.desc'),
      ],
      [
        'textSearchDocuments',
        '/documents/X000001/search/text?useDBFilenameSearch=true&size=15&page=1&sortBy=createdAt.desc',
        () => masApiClient.textSearchDocuments('X000001', '1', {}, 'createdAt.desc'),
        'post',
      ],
      [
        'textSearchDocuments',
        '/documents/X000001/search/text?useDBFilenameSearch=true&size=15&page=1',
        () => masApiClient.textSearchDocuments('X000001', '1', {}),
        'post',
      ],
      [
        'searchDocuments',
        '/documents/X000001/search?size=15&page=1&sortBy=createdAt.desc',
        () => masApiClient.searchDocuments('X000001', '1', 'createdAt.desc', {}),
        'post',
      ],
      ['getPersonRiskFlag', '/risk-flags/X000001/1', () => masApiClient.getPersonRiskFlag('X000001', '1')],

      [
        'getPersonRiskFlagSingleNote',
        '/risk-flags/X000001/1/note/2',
        () => masApiClient.getPersonRiskFlagSingleNote('X000001', '1', '2'),
      ],

      [
        'getPersonRiskRemovalFlagSingleNote',
        '/risk-flags/X000001/1/risk-removal-note/2',
        () => masApiClient.getPersonRiskRemovalFlagSingleNote('X000001', '1', '2'),
      ],
      ['getPersonCompliance', '/compliance/X000001', () => masApiClient.getPersonCompliance('X000001')],
      [
        'postAppointments',
        '/appointment/X000001',
        () =>
          masApiClient.postAppointments('X000001', {
            createOverlappingAppointment: true,
            end: undefined,
            eventId: 0,
            interval: undefined,
            licenceConditionId: 0,
            numberOfAppointments: 0,
            requirementId: 0,
            nsiId: 0,
            start: undefined,
            type: undefined,
            user: { locationCode: 'C084', username: '', teamCode: 'TEA' },
            uuid: '',
          }),
        'post',
      ],
      [
        'checkAppointments',
        '/appointment/X000001/check',
        () =>
          masApiClient.checkAppointments('X000001', {
            start: undefined,
            end: undefined,
          }),
        'post',
      ],
      [
        'searchUserCaseload',
        '/caseload/user/USER/search?size=10&page=1&sortBy=case',
        () => masApiClient.searchUserCaseload('USER', '1', 'case'),
        'post',
      ],

      [
        'searchUserCaseload',
        '/caseload/user/USER/search?size=10&page=1&sortBy=case',
        () => masApiClient.searchUserCaseload('USER', '1', 'case', { test: 'test' }),
        'post',
      ],

      ['getUserAppointments', '/user/USER/appointments', () => masApiClient.getUserAppointments('USER')],
      ['getUserTeams', '/caseload/user/USER/teams', () => masApiClient.getUserTeams('USER')],
      [
        'getOfficeLocationsByTeamAndProvider',
        '/appointment/location/provider/N56/team/N56N02',
        () => masApiClient.getOfficeLocationsByTeamAndProvider('N56', 'N56N02'),
      ],
      [
        'getUserSchedule',
        '/user/USER/schedule/TYPE?size=1&page=1&sortBy=user&ascending=asc',
        () =>
          masApiClient.getUserSchedule({
            ascending: 'asc',
            page: '1',
            size: '1',
            sortBy: 'user',
            type: 'TYPE',
            username: 'USER',
          }),
      ],
      [
        'getUserSchedule',
        '/user/USER/schedule/upcoming?size=1&page=1&sortBy=user&ascending=asc',
        () =>
          masApiClient.getUserSchedule({
            ascending: 'asc',
            page: '1',
            size: '1',
            sortBy: 'user',
            type: undefined,
            username: 'USER',
          }),
      ],

      [
        'getUserSchedule no params',
        '/user/USER/schedule/upcoming',
        () =>
          masApiClient.getUserSchedule({
            ascending: undefined,
            page: undefined,
            size: undefined,
            sortBy: undefined,
            type: undefined,
            username: 'USER',
          }),
      ],

      ['getTeamCaseload', '/caseload/team/TCCODE?size=10&page=1', () => masApiClient.getTeamCaseload('TCCODE', '1')],
      ['getTeamCaseload', '/caseload/team/TCCODE?size=10', () => masApiClient.getTeamCaseload('TCCODE', undefined)],
      ['getUserAccess', '/user/USER/access/X000001', () => masApiClient.getUserAccess('USER', 'X000001')],
      ['checkUserAccess', '/user/USER/access', () => masApiClient.checkUserAccess('USER', []), 'post'],
      ['getDeliusRoles', '/user/USER', () => masApiClient.getDeliusRoles('USER')],
    ])('it should call %s', async (_: string, url: string, func: () => Promise<any>, method = 'get', raw = false) => {
      const response = { data: 'data' }
      if (method === 'get') {
        fakeMasApiClient.get(url).matchHeader('authorization', `Bearer ${token.access_token}`).reply(200, response)
      }
      if (method === 'post') {
        fakeMasApiClient.post(url).matchHeader('authorization', `Bearer ${token.access_token}`).reply(200, response)
      }

      const output = await func()
      if (raw) {
        expect(output.statusCode).toEqual(200)
      } else {
        expect(output).toEqual(response)
      }
    })
  })
})
