import qs from 'qs'
import express, { Router } from 'express'

export default function setUpWebRequestParsing(): Router {
  const router = express.Router()
  router.use(
    express.urlencoded({
      extended: true,
      verify: (req: any, res, buf) => {
        req.rawBody = buf.toString()
      },
    }),
  )
  router.use((req: any, res, next) => {
    if (req.rawBody) {
      req.body = qs.parse(req.rawBody, { parseArrays: false })
    }
    next()
  })
  router.use(express.json())
  return router
}
