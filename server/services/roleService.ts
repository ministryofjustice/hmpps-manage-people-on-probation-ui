import MasApiClient from '../data/masApiClient'

export default class RoleService {
  constructor(private readonly masApiClient: MasApiClient) {}

  async hasAccess(role: string, username: string): Promise<boolean> {
    const deliusRoles = await this.masApiClient.getDeliusRoles(username)
    return deliusRoles?.roles?.includes(role) === true
  }
}
