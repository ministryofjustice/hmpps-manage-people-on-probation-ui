import { DateTime } from 'luxon'
import { type Router } from 'express'

let mockedTime: string | null = null

const setMockedTime = (time: string) => {
  mockedTime = DateTime.fromISO(time).toISO()
}

export const getMockedTime = () => mockedTime

export default function testRoutes(router: Router) {
  router.post('/__test/set-mocked-time', (req, res) => {
    const { time } = req.body
    if (!time) return res.status(400).send('Missing time')
    setMockedTime(time)
    req.session.mockedTime = DateTime.fromISO(time).toISO()
    return res.sendStatus(200)
  })

  router.get('/__test/get-mocked-time', (req, res) => {
    return res.status(200).send('mocked time')
  })

  return router
}
