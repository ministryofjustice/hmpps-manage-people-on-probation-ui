import MasApiClient from '../data/masApiClient'

export default class RoleService {
  constructor(private readonly masApiClient: MasApiClient) {}

  async hasAccess(role: string, username: string): Promise<boolean> {
    console.log(`Username: ${username}`)
    console.log(`Role: ${role}`)
    const deliusRoles = await this.masApiClient.getDeliusRoles(username)
    console.log(`Roles: ${deliusRoles}`)
    return deliusRoles?.roles?.includes(role) === true
  }
}
