import path from 'path'
import compression from 'compression'
import express, { Router } from 'express'
import noCache from 'nocache'

import { getConfig } from '../config'

export const setUpStaticResources = (): Router => {
  const router = express.Router()
  const config = getConfig()

  router.use(compression())

  //  Static Resources Configuration
  // Set redirect to false to prevent 301 permanently deleted redirect response when static folder accessed.
  // This retains the SP header
  const staticResourcesConfig = { maxAge: config.staticResourceCacheDuration, redirect: false }

  Array.of(
    '/dist/assets',
    '/dist/assets/css',
    '/dist/assets/js',
    '/node_modules/govuk-frontend/dist/govuk/assets',
    '/node_modules/govuk-frontend/dist',
    '/node_modules/@ministryofjustice/frontend/moj/assets',
    '/node_modules/@ministryofjustice/frontend',
    '/node_modules/jquery/dist',
    '/node_modules/accessible-autocomplete/dist',
  ).forEach(dir => {
    router.use('/assets', express.static(path.join(process.cwd(), dir), staticResourcesConfig))
  })
  ;['/node_modules/jquery/dist/jquery.min.js'].forEach(dir => {
    router.use('/assets/js/jquery.min.js', express.static(path.join(process.cwd(), dir), staticResourcesConfig))
  })
  ;['/assets/css'].forEach(dir => {
    router.use('/assets/css', express.static(path.join(process.cwd(), dir), staticResourcesConfig))
  })

  // Don't cache dynamic resources
  router.use(noCache())

  return router
}
