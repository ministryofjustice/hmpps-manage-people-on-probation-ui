interface WiremockMapping {
  request: {
    urlPattern?: string
    urlPathPattern?: string
  }
  response: {
    status: number
    jsonBody: any
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
