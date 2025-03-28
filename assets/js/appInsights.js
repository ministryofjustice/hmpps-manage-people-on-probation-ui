/* eslint-disable no-param-reassign */
/* eslint-disable no-console */

import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import { ClickAnalyticsPlugin } from '@microsoft/applicationinsights-clickanalytics-js'

document.initialiseTelemetry = (applicationInsightsConnectionString, applicationInsightsRoleName, userName) => {
  if (!applicationInsightsConnectionString) {
    console.log('AppInsights not configured')
    return
  }

  console.log('Configuring AppInsights')

  const clickPluginInstance = new ClickAnalyticsPlugin()
  const contentName = element => {
    const id = element.getAttribute('data-ai-id')
    if (id && id.includes('PersonName')) {
      return '<Persons Name>'
    }
    const uri = element.getAttribute('title')
    if (uri && uri.includes('Select case record')) {
      return 'Search Persons Name Link'
    }
    if (element.className === 'moj-filter__tag') {
      return 'Clear Filter Tag'
    }
    if (element.className.includes('moj-datepicker')) {
      return 'Date selected'
    }
    return ''
  }
  const clickPluginConfig = {
    autoCapture: true,
    dropInvalidEvents: true,
    dataTags: {
      customDataPrefix: 'data-ai-',
      useDefaultContentNameOrId: true,
    },
    callback: {
      contentName,
    },
  }

  const appInsights = new ApplicationInsights({
    config: {
      disableXhr: true,
      connectionString: applicationInsightsConnectionString,
      autoTrackPageVisitTime: true,
      extensions: [clickPluginInstance],
      extensionConfig: {
        [clickPluginInstance.identifier]: clickPluginConfig,
      },
    },
  })

  const telemetryInitializer = envelope => {
    envelope.tags['ai.cloud.role'] = applicationInsightsRoleName
    envelope.tags['ai.user.id'] = userName
  }

  appInsights.loadAppInsights()
  appInsights.addTelemetryInitializer(telemetryInitializer)
  appInsights.trackPageView()
}
