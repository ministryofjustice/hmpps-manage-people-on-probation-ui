/* eslint-disable import/no-extraneous-dependencies */
import * as Sentry from '@sentry/node'
import { getConfig } from './config'

const config = getConfig()
if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.env,
    tracesSampleRate: config.sentry.tracesSampleRate,
  })
}
