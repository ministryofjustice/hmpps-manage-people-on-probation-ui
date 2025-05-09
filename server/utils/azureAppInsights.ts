import { setup, defaultClient, TelemetryClient, DistributedTracingModes } from 'applicationinsights'
import applicationInfo from '../applicationInfo'

export function defaultName(): string {
  const { applicationName: name } = applicationInfo()
  return name
}

export function version(): string {
  const { version: buildNumber } = applicationInfo()
  return buildNumber
}

export function initialiseAppInsights(): void {
  const appInsightsConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
  if (appInsightsConnectionString) {
    // eslint-disable-next-line no-console
    console.log('Enabling azure application insights')
    setup().setDistributedTracingMode(DistributedTracingModes.AI_AND_W3C).start()
  }
}

export function buildAppInsightsClient(applicationName = defaultName()): TelemetryClient {
  const appInsightsConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
  if (appInsightsConnectionString) {
    defaultClient.context.tags['ai.cloud.role'] = applicationName
    defaultClient.context.tags['ai.application.ver'] = version()
    defaultClient.addTelemetryProcessor(envelope => {
      const telemetryItem = envelope.data.baseData
      if (telemetryItem?.url) {
        const excludedRequestUrls = ['/ping', '/metrics', '/health', '/info']
        if (excludedRequestUrls.some(url => telemetryItem.url.includes(url))) {
          return false
        }
      }
      return true
    })
    return defaultClient
  }
  return null
}
