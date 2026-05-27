import EMDIClient, { PersonExistsResponse } from '../data/emdiClient'

export const existsInEMDI = async (crn: string, token: string): Promise<string | undefined> => {
  const emdiClient = new EMDIClient(token)
  const result: PersonExistsResponse & { uri?: string } = await emdiClient.existsInEMDI(crn)
  return result?.uri
}
