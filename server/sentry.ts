import * as Sentry from '@sentry/node'
import config from './config'

if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.env,
    tracesSampleRate: config.sentry.tracesSampleRate,
    sendDefaultPii: false,
    beforeSend(event) {
      if (!event.request) {
        return event
      }

      return {
        ...event,
        request: {
          ...event.request,
          data: undefined, // removes POST body
        },
      }
    },
  })
}
