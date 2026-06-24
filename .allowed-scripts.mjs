import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
  allowlist: {
    // Needed by esbuild for watching files during development
    'node_modules/@parcel/watcher@2.5.6': 'ALLOW',
    // Needed to interface with Sentry for app monitoring
    'node_modules/@sentry/cli@3.5.1': 'ALLOW',
    // Provides capabilities for integration testing
    'node_modules/cypress@15.17.0': 'ALLOW',
    // Provides native integration, supporting ability to write dtrace probes for bunyan
    'node_modules/dtrace-provider@0.8.8': 'ALLOW',
    // ESBuild is written in GoLang - this is needed to download prebuilt binaries for the specific platform
    'node_modules/esbuild@0.28.1': 'ALLOW',
    // Needed by jest for running tests in watch mode
    'node_modules/fsevents@2.3.3': 'ALLOW',
    // Need by playwright for detecting file system changes during test runs
    'node_modules/playwright/node_modules/fsevents@2.3.2': 'ALLOW',
    // Native solution to quickly resolve module paths, used by jest and eslint
    'node_modules/unrs-resolver@1.11.1': 'ALLOW',
    // required for open telemetry for app insights
    'node_modules/@grpc/proto-loader/node_modules/protobufjs@7.6.4': 'ALLOW',
    'node_modules/@opentelemetry/otlp-transformer/node_modules/protobufjs@8.0.1': 'ALLOW',
  },
})
