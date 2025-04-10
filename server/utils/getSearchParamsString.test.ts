import httpMocks from 'node-mocks-http'
import { getSearchParamsString } from './getSearchParamsString'

describe('getSearchParamsString()', () => {
  it('should return an empty string if no query string', () => {
    const req = httpMocks.createRequest({
      query: {
        page: '2',
      },
    })
    const searchParamString = getSearchParamsString({ req, ignore: ['page'] })
    expect(searchParamString).toEqual('')
  })
  it('should return an empty string if no query and show prefix is false', () => {
    const req = httpMocks.createRequest({
      query: {},
    })
    const searchParamString = getSearchParamsString({ req, ignore: ['page'], showPrefixIfNoQuery: false })
    expect(searchParamString).toEqual('')
  })
  it('should return the prefix if no query and show prefix is true', () => {
    const req = httpMocks.createRequest({
      query: {},
    })
    const searchParamString = getSearchParamsString({ req, ignore: ['page'], showPrefixIfNoQuery: true, prefix: '?' })
    expect(searchParamString).toEqual('?')
  })
  it('should return only the prefix if no query string but showPrefix = true', () => {
    const req = httpMocks.createRequest({
      query: {
        page: '2',
      },
    })
    const searchParamString = getSearchParamsString({ req, ignore: ['page'], showPrefixIfNoQuery: true })
    expect(searchParamString).toEqual('?')
  })
  it('should return the full search param string and the suffix', () => {
    const req = httpMocks.createRequest({
      query: {
        page: '2',
        sortBy: 'name.asc',
      },
    })
    const searchParamString = getSearchParamsString({ req, suffix: '&' })
    expect(searchParamString).toEqual('?page=2&sortBy=name.asc&')
  })
  it('should not add the prefix', () => {
    const req = httpMocks.createRequest({
      query: {
        page: '2',
        sortBy: 'name.asc',
      },
    })
    const searchParamString = getSearchParamsString({ req, prefix: '' })
    expect(searchParamString).toEqual('page=2&sortBy=name.asc')
  })
})
