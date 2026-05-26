import EMDIClient, { PersonExistsResponse } from '../data/emdiClient'

export const existsInEMDI = async (crn: string, token: string): Promise<string> => {
  const emdiClient = new EMDIClient(token)
  const result: PersonExistsResponse = await emdiClient.existsInEMDI(crn)
  return result?.uri
}
