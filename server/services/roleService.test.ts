import MasApiClient from '../data/masApiClient'
import RoleService from './roleService'
import { DeliusRoleEnum, DeliusRoles } from '../data/model/deliusRoles'

jest.mock('../data/masApiClient')

describe('Delius Role service', () => {
  let masApiClient: jest.Mocked<MasApiClient>
  let roleService: RoleService

  describe('hasAccess', () => {
    beforeEach(() => {
      masApiClient = new MasApiClient(null) as jest.Mocked<MasApiClient>
      roleService = new RoleService(masApiClient)
    })

    it('returns true when user has MANAGE_USER access', async () => {
      masApiClient.getDeliusRoles.mockResolvedValue({ roles: [DeliusRoleEnum.MANAGE_USERS] } as DeliusRoles)
      const result = await roleService.hasAccess(DeliusRoleEnum.MANAGE_USERS, 'johnsmith')
      expect(result).toEqual(true)
    })

    it('returns false when user does not have MANAGE_USER access', async () => {
      masApiClient.getDeliusRoles.mockResolvedValue({ roles: ['ROLE1'] } as DeliusRoles)
      const result = await roleService.hasAccess(DeliusRoleEnum.MANAGE_USERS, 'johnsmith')
      expect(result).toEqual(false)
    })

    it('returns false when getDeliusRoles is null', async () => {
      masApiClient.getDeliusRoles.mockResolvedValue(null as DeliusRoles)
      const result = await roleService.hasAccess(DeliusRoleEnum.MANAGE_USERS, 'johnsmith')
      expect(result).toEqual(false)
    })

    it('returns false when getDeliusRoles.roles is null', async () => {
      masApiClient.getDeliusRoles.mockResolvedValue({ roles: null } as DeliusRoles)
      const result = await roleService.hasAccess(DeliusRoleEnum.MANAGE_USERS, 'johnsmith')
      expect(result).toEqual(false)
    })
  })
})
