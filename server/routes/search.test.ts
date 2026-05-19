import { Router } from 'express'
import httpMocks from 'node-mocks-http'
import searchRoutes from './search'
import { Services } from '../services'

describe('Search Routes', () => {
  let router: Router
  let services: Services
  let searchService: any

  beforeEach(() => {
    router = Router()
    searchService = {
      get: jest.fn((req, res, next) => next()),
      post: jest.fn((req, res, next) => next()),
    }
    services = {
      searchService,
    } as unknown as Services

    searchRoutes(router, services)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Test search POST endpoint', () => {
    it('Should call searchService.post', () => {
      const req = httpMocks.createRequest({ method: 'POST', url: '/search' })
      const res = httpMocks.createResponse()
      const next = jest.fn()

      const handler = (router as any).stack.find((s: any) => s.route.path === '/search' && s.route.methods.post).route
        .stack[0].handle

      handler(req, res, next)

      expect(searchService.post).toHaveBeenCalledWith(req, res, next)
    })
  })

  describe('Test search GET endpoint', () => {
    it('Should call searchService.get', () => {
      const req = httpMocks.createRequest({ method: 'GET', url: '/search' })
      const res = httpMocks.createResponse()
      const next = jest.fn()

      const handler = (router as any).stack.find((s: any) => s.route.path === '/search' && s.route.methods.get).route
        .stack[0].handle

      handler(req, res, next)

      expect(searchService.get).toHaveBeenCalledWith(req, res, next)
    })
  })
})
