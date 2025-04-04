import { setSortOrder } from './setSortOrder'

describe('utils/setSortOrder', () => {
  it('should return descending', () => {
    expect(setSortOrder('name', 'name.desc')).toEqual('descending')
  })
  it('should return ascending', () => {
    expect(setSortOrder('sentence', 'sentence.asc')).toEqual('ascending')
  })
  it('should return none', () => {
    expect(setSortOrder('name', 'sentence.asc')).toEqual('none')
  })
})
