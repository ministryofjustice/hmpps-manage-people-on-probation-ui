/* eslint-disable no-console */
const { copy } = require('esbuild-plugin-copy')
const { typecheckPlugin } = require('@jgoz/esbuild-plugin-typecheck')
const esbuild = require('esbuild')
const glob = require('glob')
const pkg = require('../package.json')

const buildApp = buildConfig =>
  esbuild.build({
    entryPoints: glob.sync(buildConfig.app.entryPoints),
    outdir: buildConfig.app.outDir,
    bundle: buildConfig.isProduction,
    sourcemap: !buildConfig.isProduction,
    platform: 'node',
    format: 'cjs',
    external: buildConfig.isProduction
      ? [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})]
      : [],
    plugins: [
      typecheckPlugin(),
      copy({
        resolveFrom: 'cwd',
        assets: buildConfig.app.copy,
      }),
    ],
  })

module.exports = buildConfig => {
  console.log('\u{1b}[1m\u{2728}  Building app...\u{1b}[0m')
  console.log(`Building with isProduction set to ${buildConfig.isProduction} `)

  return buildApp(buildConfig)
}
