import { filterSparks } from './filterSparks'
import { Spark } from '../data/model/schedule'

describe('filterSparks', () => {
  it('should return an empty array if no sparks are provided', () => {
    expect(filterSparks([])).toEqual([])
  })

  it('should return an empty array if sparks are undefined', () => {
    expect(filterSparks(undefined)).toEqual([])
  })

  it('should sort sparks alphabetically by description', () => {
    const sparks: Spark[] = [
      { code: 'Z', description: 'Zebra' },
      { code: 'A', description: 'Apple' },
      { code: 'M', description: 'Banana' },
    ]
    const sortedSparks: Spark[] = [
      { code: 'A', description: 'Apple' },
      { code: 'M', description: 'Banana' },
      { code: 'Z', description: 'Zebra' },
    ]
    expect(filterSparks(sparks)).toEqual(sortedSparks)
  })

  it('should not mutate the original array', () => {
    const sparks: Spark[] = [
      { code: 'Z', description: 'Zebra' },
      { code: 'A', description: 'Apple' },
    ]
    filterSparks(sparks)
    expect(sparks.map(s => s.code)).toEqual(['Z', 'A'])
  })
})
