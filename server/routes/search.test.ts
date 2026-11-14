import { Router } from 'express'
import httpMocks from 'node-mocks-http'
import SearchService from '@ministryofjustice/probation-search-frontend/service/searchService'
import searchRoutes from './search'
import { Services } from '../services'

describe('Search Routes', () => {
  let router: Router
  let services: Services
  let searchService: SearchService
  let typedSearchService: SearchService

  beforeEach(() => {
    router = Router()
    searchService = {
      get: jest.fn((req, res, next) => next()),
      post: jest.fn((req, res, next) => next()),
    }
    typedSearchService = {
      get: jest.fn((req, res, next) => next()),
      post: jest.fn((req, res, next) => next()),
    }
    services = {
      searchService,
      typedSearchService,
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

      const handler = router.stack.find(
        s => s.route.path === '/search' && (s.route as unknown as { methods: Record<string, boolean> }).methods.post,
      ).route.stack[0].handle

      handler(req, res, next)

      expect(searchService.post).toHaveBeenCalledWith(req, res, next)
    })

    it('Should use typedSearchService.post when flag applied', () => {
      const req = httpMocks.createRequest({ method: 'POST', url: '/search' })
      const res = httpMocks.createResponse({
        locals: {
          flags: {
            enableAsYouTypeSearch: true,
          },
        },
      })
      const next = jest.fn()

      const handler = router.stack.find(
        s => s.route.path === '/search' && (s.route as unknown as { methods: Record<string, boolean> }).methods.post,
      ).route.stack[0].handle

      handler(req, res, next)

      expect(typedSearchService.post).toHaveBeenCalledWith(req, res, next)
    })
  })

  describe('Test search GET endpoint', () => {
    it('Should call searchService.get', () => {
      const req = httpMocks.createRequest({ method: 'GET', url: '/search' })
      const res = httpMocks.createResponse()
      const next = jest.fn()

      const handler = router.stack.find(
        s => s.route.path === '/search' && (s.route as unknown as { methods: Record<string, boolean> }).methods.get,
      ).route.stack[0].handle

      handler(req, res, next)

      expect(searchService.get).toHaveBeenCalledWith(req, res, next)
    })

    it('Should use typedSearchService.get when flag applied', () => {
      const req = httpMocks.createRequest({ method: 'GET', url: '/search' })
      const res = httpMocks.createResponse({
        locals: {
          flags: {
            enableAsYouTypeSearch: true,
          },
        },
      })
      const next = jest.fn()

      const handler = router.stack.find(
        s => s.route.path === '/search' && (s.route as unknown as { methods: Record<string, boolean> }).methods.get,
      ).route.stack[0].handle

      handler(req, res, next)

      expect(typedSearchService.get).toHaveBeenCalledWith(req, res, next)
    })
  })
})
