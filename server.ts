// Require app insights before anything else to allow for instrumentation of bunyan and express
import 'applicationinsights'
import { initialiseAppInsights, buildAppInsightsClient } from './server/utils/azureAppInsights'
import { app, metricsApp } from './server/index'
import logger from './logger'

initialiseAppInsights()
buildAppInsightsClient()

const validatePort = (port: number) => {
  if (port >= 0 && port <= 65535) {
    return port
  }
  throw new Error(`Port number out of range ${port}`)
}
const port = validatePort(app.get('port') && 3007)
app.set('port', port)
app.listen(port, () => {
  logger.info(`Server listening on port ${port}`)
})

const metricsPort = validatePort(metricsApp.get('port') && 3000)
metricsApp.listen(metricsPort, () => {
  logger.info(`Metrics server listening on port ${metricsPort}`)
})
