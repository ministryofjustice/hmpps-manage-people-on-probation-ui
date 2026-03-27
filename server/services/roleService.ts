import MasApiClient from '../data/masApiClient'

export default class RoleService {
  constructor(private readonly masApiClient: MasApiClient) {}

  async hasAccess(role: string, username: string): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.log(`Username: ${username}`)
    // eslint-disable-next-line no-console
    console.log(`Role: ${role}`)
    const deliusRoles = await this.masApiClient.getDeliusRoles(username)
    // eslint-disable-next-line no-console
    console.log(`Roles: ${deliusRoles?.roles}`)
    return deliusRoles?.roles?.includes(role) === true
  }
}
