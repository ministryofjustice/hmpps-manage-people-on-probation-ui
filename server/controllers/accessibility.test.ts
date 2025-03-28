import httpMocks from 'node-mocks-http'
import controllers from '.'
import { mockAppResponse } from './mocks'

const res = mockAppResponse()
const req = httpMocks.createRequest()
const renderSpy = jest.spyOn(res, 'render')

describe('accessibilityController', () => {
  describe('getAccessibility', () => {
    beforeAll(async () => {
      await controllers.accessibility.getAccessibility()(req, res)
    })
    it('should render the accessibility page', () => {
      expect(renderSpy).toHaveBeenCalledWith('pages/accessibility')
    })
  })
})
