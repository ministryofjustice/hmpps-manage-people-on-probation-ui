import type { Router } from 'express'
import express from 'express'
import passport from 'passport'
import flash from 'connect-flash'
import * as Sentry from '@sentry/node'
import config from '../config'
import auth from '../authentication/auth'
import { AppResponse } from '../models/Locals'

const router = express.Router()

export default function setUpAuth(): Router {
  auth.init()

  router.use(passport.initialize())
  router.use(passport.session())
  router.use(flash())

  router.get('/autherror', (_req, res) => {
    res.status(401)
    return res.render('autherror')
  })

  router.get('/no-perm-autherror', (req, res) => {
    res.locals.backLink = req.query.backLink
    res.status(403)
    return res.render('no-perm-autherror')
  })

  router.get('/sign-in', passport.authenticate('oauth2'))

  router.get('/sign-in/callback', (req, res, next) =>
    passport.authenticate('oauth2', {
      successReturnToOrRedirect: req.session.returnTo ?? '/',
      failureRedirect: '/autherror',
    })(req, res, next),
  )

  const authUrl = config.apis.hmppsAuth.externalUrl
  const authParameters = `client_id=${config.apis.hmppsAuth.apiClientId}&redirect_uri=${config.domain}`

  router.use('/sign-out', (req, res, next) => {
    const authSignOutUrl = `${authUrl}/sign-out?${authParameters}`
    if (req.user) {
      req.logout(err => {
        if (err) return next(err)
        return req.session.destroy(() => res.redirect(authSignOutUrl))
      })
    } else res.redirect(authSignOutUrl)
  })

  router.use('/account-details', (req, res) => {
    res.redirect(`${authUrl}/account-details?${authParameters}`)
  })

  router.use((req, res: AppResponse, next) => {
    if (req.isAuthenticated()) Sentry.setUser({ username: req.user.username })
    res.locals.user = req.user
    next()
  })

  return router
}
