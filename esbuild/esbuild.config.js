/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
const path = require('path')
const { glob } = require('glob')
const chokidar = require('chokidar')
const { spawn } = require('child_process')
const buildAssets = require('./assets.config')
const buildApp = require('./app.config')

const nwDir = path.dirname(process.execPath)
const cwd = process.cwd()

/**
 * Configuration for build steps
 * @type {BuildConfig}
 */
const buildConfig = {
  isProduction: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : false,
  app: {
    outDir: path.join(cwd, 'dist'),
    entryPoints:
      process.env.NODE_ENV === 'production'
        ? path.join(cwd, 'server.ts')
        : glob
            .sync([path.join(cwd, '*.ts'), path.join(cwd, 'server/**/*.ts'), path.join(cwd, 'app/**/*.ts')])
            .filter(file => !file.endsWith('.test.ts') && !file.includes(`${path.sep}packages${path.sep}`)),
    copy: [
      {
        from: path.join(cwd, 'server/views/**/*'),
        to: path.join(cwd, 'dist/server/views'),
      },
    ],
  },
  assets: {
    outDir: path.join(cwd, 'dist/assets'),
    entryPoints: glob.sync([path.join(cwd, 'assets/js/index.js'), path.join(cwd, 'assets/scss/application.scss')]),
    copy: [
      {
        from: path.join(cwd, 'assets/images/**/*'),
        to: path.join(cwd, 'dist/assets/images'),
      },
      {
        from: path.join(cwd, 'assets/js/fallback_prob_fe_app.js'),
        to: path.join(cwd, 'dist/assets/js/fallback_prob_fe_app.js'),
      },
      {
        from: path.join(cwd, 'package.json'),
        to: path.join(cwd, 'dist/package.json'),
      },
    ],
    clear: glob.sync([path.join(cwd, 'dist/assets/{css,js}')]),
  },
}

function main() {
  const chokidarOptions = {
    persistent: true,
    ignoreInitial: true,
  }

  const args = process.argv

  if (args.includes('--build')) {
    Promise.all([buildApp(buildConfig), buildAssets(buildConfig)]).catch(() => process.exit(1))
  }

  const spawnServer = cmdArgs => {
    let serverProcess = null
    chokidar.watch(['dist'], chokidarOptions).on('all', () => {
      if (serverProcess) serverProcess.kill()
      serverProcess = spawn(`${nwDir}/node`, cmdArgs, { stdio: 'inherit' })
    })
  }

  if (args.includes('--feature-dev-server')) {
    spawnServer(['--inspect=0.0.0.0', '--enable-source-maps', 'dist/server.js', '|', 'bunyan', '-o', 'short'])
  }

  if (args.includes('--dev-server')) {
    spawnServer([
      '--inspect=0.0.0.0',
      '--enable-source-maps',
      '-r',
      'dotenv/config',
      'dist/server.js',
      '|',
      'bunyan',
      '-o',
      'short',
    ])
  }

  if (args.includes('--watch')) {
    console.log('\u{1b}[1m\u{1F52D} Watching for changes...\u{1b}[0m')

    // Watch assets
    chokidar.watch(['assets/**/*'], chokidarOptions).on('all', () => buildAssets(buildConfig).catch(console.error))

    // Watch app and server, ignoring test files and packages
    chokidar
      .watch(['server/**/*', 'app/**/*'], {
        ...chokidarOptions,
        ignored: [
          '**/*.test.ts',
          '**/packages/**', // ignore all files under packages
        ],
      })
      .on('all', () => buildApp(buildConfig).catch(console.error))
  }
}

main()
