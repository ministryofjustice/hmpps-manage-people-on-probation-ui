import { getConfig } from '../config'

const getClientToken = (clientId: string, clientSecret: string): string => {
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  return `Basic ${token}`
}

const generateOauthClientToken = (clientId?: string, clientSecret?: string) => {
  const config = getConfig()
  return getClientToken(
    clientId ?? config.apis.hmppsAuth.apiClientId,
    clientSecret ?? config.apis.hmppsAuth.apiClientSecret,
  )
}

export default generateOauthClientToken
