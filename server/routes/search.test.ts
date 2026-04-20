import { Router } from 'express'
import httpMocks from 'node-mocks-http'
import searchRoutes from './search'
import { Services } from '../services'

describe('Search Routes', () => {
  let router: Router
  let services: Services
  let searchService: any
  let searchServiceWithoutExtraColumns: any

  beforeEach(() => {
    router = Router()
    searchService = {
      get: jest.fn((req, res, next) => next()),
      post: jest.fn((req, res, next) => next()),
    }
    searchServiceWithoutExtraColumns = {
      get: jest.fn((req, res, next) => next()),
      post: jest.fn((req, res, next) => next()),
    }
    services = {
      searchService,
      searchServiceWithoutExtraColumns,
    } as unknown as Services

    searchRoutes(router, services)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Test search POST endpoint', () => {
    it('Should call searchService.post when enablePoPSearchExtraColumns is true', () => {
      const req = httpMocks.createRequest({ method: 'POST', url: '/search' })
      const res = httpMocks.createResponse()
      res.locals.flags = { enablePoPSearchExtraColumns: true }
      const next = jest.fn()

      const handler = (router as any).stack.find((s: any) => s.route.path === '/search' && s.route.methods.post).route
        .stack[0].handle

      handler(req, res, next)

      expect(searchService.post).toHaveBeenCalledWith(req, res, next)
      expect(searchServiceWithoutExtraColumns.post).not.toHaveBeenCalled()
    })

    it('Should call searchServiceWithoutExtraColumns.post when enablePoPSearchExtraColumns is false', () => {
      const req = httpMocks.createRequest({ method: 'POST', url: '/search' })
      const res = httpMocks.createResponse()
      res.locals.flags = { enablePoPSearchExtraColumns: false }
      const next = jest.fn()

      const handler = (router as any).stack.find((s: any) => s.route.path === '/search' && s.route.methods.post).route
        .stack[0].handle

      handler(req, res, next)

      expect(searchServiceWithoutExtraColumns.post).toHaveBeenCalledWith(req, res, next)
      expect(searchService.post).not.toHaveBeenCalled()
    })

    it('Should call searchServiceWithoutExtraColumns.post when enablePoPSearchExtraColumns is undefined', () => {
      const req = httpMocks.createRequest({ method: 'POST', url: '/search' })
      const res = httpMocks.createResponse()
      res.locals.flags = {}
      const next = jest.fn()

      const handler = (router as any).stack.find((s: any) => s.route.path === '/search' && s.route.methods.post).route
        .stack[0].handle

      handler(req, res, next)

      expect(searchServiceWithoutExtraColumns.post).toHaveBeenCalledWith(req, res, next)
      expect(searchService.post).not.toHaveBeenCalled()
    })
  })

  describe('Test search GET endpoint', () => {
    it('Should call searchService.get when enablePoPSearchExtraColumns is true', () => {
      const req = httpMocks.createRequest({ method: 'GET', url: '/search' })
      const res = httpMocks.createResponse()
      res.locals.flags = { enablePoPSearchExtraColumns: true }
      const next = jest.fn()

      const handler = (router as any).stack.find((s: any) => s.route.path === '/search' && s.route.methods.get).route
        .stack[0].handle

      handler(req, res, next)

      expect(searchService.get).toHaveBeenCalledWith(req, res, next)
      expect(searchServiceWithoutExtraColumns.get).not.toHaveBeenCalled()
    })

    it('Should call searchServiceWithoutExtraColumns.get when enablePoPSearchExtraColumns is false', () => {
      const req = httpMocks.createRequest({ method: 'GET', url: '/search' })
      const res = httpMocks.createResponse()
      res.locals.flags = { enablePoPSearchExtraColumns: false }
      const next = jest.fn()

      const handler = (router as any).stack.find((s: any) => s.route.path === '/search' && s.route.methods.get).route
        .stack[0].handle

      handler(req, res, next)

      expect(searchServiceWithoutExtraColumns.get).toHaveBeenCalledWith(req, res, next)
      expect(searchService.get).not.toHaveBeenCalled()
    })
  })
})
