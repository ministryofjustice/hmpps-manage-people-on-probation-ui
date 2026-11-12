import { swapNameOrder } from './name'

describe('name utilities', () => {
  describe('swapNameOrder', () => {
    it.each([
      ['Dove, Rachel', 'Rachel Dove'],
      [' Smith ,  John   ', 'John Smith'],
      ['Dave Smith ', 'Dave Smith'],
      [undefined, ''],
    ])('should render %s as %s', (name, expected) => {
      expect(swapNameOrder(name)).toEqual(expected)
    })
  })
})
