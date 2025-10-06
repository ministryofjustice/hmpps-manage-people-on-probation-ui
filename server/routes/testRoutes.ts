import { DateTime } from 'luxon'
import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Route } from '../@types'

export default function testRoutes(router: Router) {
  const post = (path: string, handler: Route<void>) => router.post(path, asyncMiddleware(handler))

  post('/__test/set-mocked-time', (req, res) => {
    const { time } = req.body
    if (!time) return res.status(400).send('Missing time')

    // Save mocked time as ISO string in session
    req.session.mockedTime = DateTime.fromISO(time).toISO()
    return res.sendStatus(200)
  })
}
