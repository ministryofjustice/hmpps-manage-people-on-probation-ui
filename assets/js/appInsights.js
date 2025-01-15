/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-console */

import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import { ClickAnalyticsPlugin } from '@microsoft/applicationinsights-clickanalytics-js'

document.initialiseTelemetry = (
  applicationInsightsConnectionString,
  applicationInsightsRoleName,
  coreTelemetryData,
) => {
  if (!applicationInsightsConnectionString) {
    console.log('AppInsights not configured')
    return
  }

  console.log('Configuring AppInsights')

  const clickPluginInstance = new ClickAnalyticsPlugin()
  const clickPluginConfig = {
    autoCapture: true,
    dropInvalidEvents: true,
    dataTags: {
      customDataPrefix: 'data-ai-',
      useDefaultContentNameOrId: true,
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
    envelope.data.ASSESSMENT_ID = coreTelemetryData.assessmentId
    envelope.data.ASSESSMENT_VERSION = coreTelemetryData.assessmentVersion.toString()
    envelope.data.SECTION_CODE = coreTelemetryData.section
    envelope.data.USER_ID = coreTelemetryData.user
    envelope.data.HANDOVER_SESSION_ID = coreTelemetryData.handoverSessionId
    envelope.data.FORM_VERSION = coreTelemetryData.formVersion.split(':')[1] || 'Unknown'
  }

  appInsights.loadAppInsights()
  appInsights.addTelemetryInitializer(telemetryInitializer)
  appInsights.trackPageView()

  const trackEvent = (name, properties) => {
    console.log(`Sending telemetry event: ${name}`)
    appInsights.trackEvent({ name }, properties)
  }

  document.addEventListener('autosave', () => {
    trackEvent('AUTOSAVED')
  })

  document.addEventListener('copy', e => {
    ;['textarea', 'text'].includes(e.target.type) && trackEvent('USER_COPY', { QUESTION_CODE: e.target.name })
  })

  document.addEventListener('paste', e => {
    ;['textarea', 'text'].includes(e.target.type) && trackEvent('USER_PASTE', { QUESTION_CODE: e.target.name })
  })
}
