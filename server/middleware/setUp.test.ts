import express from 'express'
import request from 'supertest'
import nock from 'nock'
import setUpHealthChecks from './setUpHealthChecks'
import type { ApplicationInfo } from '../applicationInfo'
import config from '../config'

const app = express()

const testAppInfo: ApplicationInfo = {
  applicationName: 'test',
  buildNumber: '1',
  gitRef: 'long ref',
  gitShortHash: 'short ref',
  branchName: 'main',
}

describe('Health checks', () => {
  let fakeAuthClient: nock.Scope
  let fakeManageUsersApi: nock.Scope
  beforeEach(() => {
    fakeAuthClient = nock(config.apis.hmppsAuth.url)
    fakeManageUsersApi = nock(config.apis.manageUsersApi.url)
    app.use(setUpHealthChecks(testAppInfo))
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('Health checks shows UP', async () => {
    fakeAuthClient.get('/health/ping').reply(200, { status: 'UP' })
    fakeManageUsersApi.get('/health/ping').reply(200, { status: 'UP' })
    return request(app).get('/health').expect(200)
  })

  it('Health checks shows DOWN', async () => {
    fakeAuthClient.get('/health/ping').reply(503, { status: 'DOWN' })
    fakeManageUsersApi.get('/health/ping').reply(503, { status: 'DOWN' })
    return request(app).get('/health').expect(503)
  })

  it('Health checks shows UP', async () => {
    fakeAuthClient.get('/health/ping').reply(200, { status: 'UP' })
    fakeManageUsersApi.get('/health/ping').reply(200, { status: 'UP' })
    return request(app).get('/health').expect(200)
  })

  it('Ping checks shows UP', async () => {
    const response = await request(app).get('/ping').expect(200)
    expect(response.body.status).toEqual('UP')
  })

  it('Info returns data', async () => {
    const response = await request(app).get('/info').expect(200)
    expect(response.body.git.branch).toEqual(testAppInfo.branchName)
  })
})
