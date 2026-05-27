import EMDIClient, { PersonExistsResponse } from '../data/emdiClient'

export const existsInEMDI = async (crn: string, token: string): Promise<string | undefined> => {
  const emdiClient = new EMDIClient(token)
  const result: PersonExistsResponse & { uri?: string } = await emdiClient.existsInEMDI(crn)
  return safeEMDIUri(result?.uri)
}

const safeEMDIUri = (value?: string): string | undefined => {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') {
      return undefined
    }

    return url.toString()
  } catch {
    return undefined
  }
}
