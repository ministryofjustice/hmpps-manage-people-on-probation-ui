// Require app insights before anything else to allow for instrumentation of bunyan and express
import 'applicationinsights'
import { initialiseAppInsights, buildAppInsightsClient } from './server/utils/azureAppInsights'
import { app, metricsApp } from './server/index'
import logger from './logger'

initialiseAppInsights()
buildAppInsightsClient()

app.listen(app.get('port'), () => {
  logger.info(`Server listening on port ${app.get('port')}`)
})

metricsApp.listen(metricsApp.get('port'), () => {
  logger.info(`Metrics server listening on port ${metricsApp.get('port')}`)
})
