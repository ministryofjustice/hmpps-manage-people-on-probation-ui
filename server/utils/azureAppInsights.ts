import { setup, defaultClient, TelemetryClient, DistributedTracingModes } from 'applicationinsights'
import applicationInfo from '../applicationInfo'

const appInsightsConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING

export function defaultName(): string {
  const { applicationName: name } = applicationInfo()
  return name
}

function version(): string {
  const { version: buildNumber } = applicationInfo()
  return buildNumber
}

export function initialiseAppInsights(): void {
  if (appInsightsConnectionString) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')

    setup().setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C).start()
  }
}

export function buildAppInsightsClient(applicationName = defaultName()): TelemetryClient {
  if (appInsightsConnectionString) {
    defaultClient.context.tags['ai.cloud.role'] = applicationName
    defaultClient.context.tags['ai.application.ver'] = version()
    const filteredUrls = ['/ping', '/metrics', '/health', '/info']
    defaultClient.addTelemetryProcessor((envelope, _context) => {
      if (envelope.data.baseType === 'RequestData') {
        const requestUrl: string = envelope.data.baseData.url
        if (filteredUrls.some(filteredUrl => requestUrl.includes(filteredUrl))) {
          return null
        }
      }
      return true
    })
    return defaultClient
  }
  return null
}
