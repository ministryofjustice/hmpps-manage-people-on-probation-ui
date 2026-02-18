export interface SentryConfig {
  dsn: string
  loaderScriptId: string
  tracesSampleRate: number
  replaySampleRate: number
  replayOnErrorSampleRate: number
}
