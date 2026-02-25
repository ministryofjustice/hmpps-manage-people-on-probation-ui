import { concat } from './concat'

describe('utils/concat', () => {
  it('should throw an error if argument is not an array', () => {
    try {
      concat('value' as unknown as string[], 'new value')
    } catch (e) {
      expect(e.message).toBe('First argument must be an array')
    }
  })
  it('should add the value argument to the array', () => {
    expect(concat(['value 1', 'value 2'], 'value 3')).toEqual(['value 1', 'value 2', 'value 3'])
  })
})
