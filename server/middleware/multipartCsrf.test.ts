import express from 'express'
import session from 'express-session'
import multer from 'multer'
import request from 'supertest'
import { csrfSync } from 'csrf-sync'

// Regression test for the middleware order used in app.ts: multer parses the multipart body first,
// so that csrf-sync can read the token from req.body._csrf.
describe('csrf protection of multipart forms', () => {
  const path = '/add-note'
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10, files: 1 } })

  const createApp = () => {
    const { csrfSynchronisedProtection } = csrfSync({
      // eslint-disable-next-line no-underscore-dangle
      getTokenFromRequest: req => req.body?._csrf,
    })
    const app = express()
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false }))
    app.use(express.urlencoded({ extended: true }))
    app.post(path, (req, res, next) => upload.single('fileUpload')(req, res, () => next()))
    app.use(csrfSynchronisedProtection)
    app.get(path, (req, res) => res.send(req.csrfToken()))
    app.post(path, (req, res) => res.send(`file:${req.file ? req.file.size : 'none'}`))
    app.use(
      (err: { statusCode?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        res.sendStatus(err.statusCode || 500)
      },
    )
    return app
  }

  const getToken = async (agent: ReturnType<typeof request.agent>) => (await agent.get(path)).text

  it('accepts a multipart post with a valid token', async () => {
    const agent = request.agent(createApp())
    const token = await getToken(agent)
    const res = await agent.post(path).field('_csrf', token).attach('fileUpload', Buffer.from('12345'), 'a.pdf')
    expect(res.status).toBe(200)
    expect(res.text).toBe('file:5')
  })

  it('rejects a multipart post without a token', async () => {
    const agent = request.agent(createApp())
    await getToken(agent)
    const res = await agent.post(path).attach('fileUpload', Buffer.from('12345'), 'a.pdf')
    expect(res.status).toBe(403)
  })

  it('rejects a multipart post with an invalid token', async () => {
    const agent = request.agent(createApp())
    await getToken(agent)
    const res = await agent.post(path).field('_csrf', 'invalid').attach('fileUpload', Buffer.from('12345'), 'a.pdf')
    expect(res.status).toBe(403)
  })

  it('still passes csrf when the file is over the size limit, so the validation message can be shown', async () => {
    const agent = request.agent(createApp())
    const token = await getToken(agent)
    const res = await agent
      .post(path)
      .field('_csrf', token)
      .attach('fileUpload', Buffer.from('a'.repeat(50)), 'a.pdf')
    expect(res.status).toBe(200)
    expect(res.text).toBe('file:none')
  })
})
