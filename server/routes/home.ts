import { type Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import type { Route } from '../@types'
import type { Services } from '../services'
import MasApiClient from '../data/masApiClient'
import config from '../config'

export default function homeRoutes(router: Router, { hmppsAuthClient, searchService }: Services) {
  const get = (path: string | string[], handler: Route<void>) => router.get(path, asyncMiddleware(handler))

  get('/', async (_req, res, _next) => {
    const token = await hmppsAuthClient.getSystemClientToken(res.locals.user.username)
    const masClient = new MasApiClient(token)
    const { appointments, outcomes } = await masClient.getUserAppointments(res.locals.user.username)

    res.render('pages/homepage/homepage', {
      appointments,
      outcomes,
      delius_link: config.delius.link,
      oasys_link: config.oaSys.link,
      interventions_link: config.interventions.link,
    })
  })

  router.post('/', searchService.post)
}
