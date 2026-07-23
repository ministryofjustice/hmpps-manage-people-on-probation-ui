import type { RequestHandler } from 'express'

export default function setUpSuccessBanner(): RequestHandler {
  return function setUpSuccessBannerInner(req, res, next) {
    const contactCreated = req.flash('contactCreated')?.[0]
    res.locals.showSuccessBanner = !!contactCreated
    res.locals.uploadFailed = contactCreated === 'uploadFailed'
    next()
  }
}
