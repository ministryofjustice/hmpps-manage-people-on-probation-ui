import { ValidationSpec } from '../../server/utils/validationUtils'

export interface WiremockMapping {
  request: {
    urlPattern?: string
    urlPathPattern?: string
    method?: string
    queryParameters?: {
      [key: string]: { matches: string }
    }
  }
  response: {
    status: number
    headers: Record<string, string>
    jsonBody?: any
  }
}

export interface Wiremock {
  mappings: WiremockMapping[]
}

export const getWiremockData = <TType>(mock: Wiremock, endpoint: string, prop: string): TType => {
  const mapping: WiremockMapping = mock.mappings.find(
    m => m.request.urlPattern === endpoint || m.request.urlPathPattern === endpoint,
  )
  return mapping.response.jsonBody[prop]
}

export const getErrorMessage = (spec: ValidationSpec, name: string, validator: string): string => {
  return spec[name].checks.find(check => check.validator.name === validator)?.msg
}
