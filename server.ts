// Require app insights before anything else to allow for instrumentation of bunyan and express
import { utils as sharedUtils } from '@ministryofjustice/manage-people-on-probation-shared-lib'
import 'applicationinsights'
import { app, metricsApp } from './server/index'
import logger from './logger'

sharedUtils.initialiseAppInsights()
sharedUtils.buildAppInsightsClient()

const validatePort = (port: number) => {
  if (port >= 0 && port <= 65535) {
    return port
  }
  throw new Error(`Port number out of range ${port}`)
}
const port = validatePort(app.get('port'))
app.set('port', port)
app.listen(port, () => {
  logger.info(`Server listening on port ${port}`)
})
const metricsPort = validatePort(metricsApp.get('port'))
metricsApp.listen(metricsPort, () => {
  logger.info(`Metrics server listening on port ${metricsPort}`)
})
