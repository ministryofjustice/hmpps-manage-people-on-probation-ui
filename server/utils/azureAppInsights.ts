import { trace } from '@opentelemetry/api'
import { initialiseTelemetry, flushTelemetry, telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import applicationInfo from '../applicationInfo'
import logger from '../../logger'

export function defaultName(): string {
  const { applicationName: name } = applicationInfo()
  return name
}

// Returns the W3C trace id of the currently active server-side span (e.g. the
// request handling the current page render), so it can be threaded into the
// rendered page and adopted by the browser SDK. This lets pageViews/clicks be
// correlated in App Insights with the dependency calls the same request made.
export function currentTraceId(): string | undefined {
  return trace.getActiveSpan()?.spanContext().traceId
}

export function version(): string {
  const { version: buildNumber } = applicationInfo()
  return buildNumber
}

initialiseTelemetry({
  serviceName: defaultName(),
  serviceVersion: process.env.BUILD_NUMBER || 'unknown',
  connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  debug: process.env.DEBUG_TELEMETRY === 'true',
})
  .addFilter(telemetry.processors.filterSpanWherePath(['/ping', '/metrics', '/health', '/info']))
  .addModifier(telemetry.processors.enrichSpanNameWithHttpRoute())
  .startRecording()

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down...`)
  await flushTelemetry()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
