import { monitoring, services } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import promClient from 'prom-client'
import createApp from './app'

promClient.collectDefaultMetrics()

const app = createApp(services.initServices())
const metricsApp = monitoring.createMetricsApp()

export { app, metricsApp }
