import { merge } from './merge'

describe('merge', () => {
  it('should perform a shallow merge of two plain objects', () => {
    const obj1 = { a: 1, b: 2 }
    const obj2 = { c: 3, d: 4 }
    expect(merge(obj1, obj2)).toEqual({ a: 1, b: 2, c: 3, d: 4 })
  })

  it('should use properties from the second object when keys overlap', () => {
    const obj1 = { a: 1, b: 2, c: 'original' }
    const obj2 = { c: 'overwritten', d: 4 }
    expect(merge(obj1, obj2)).toEqual({ a: 1, b: 2, c: 'overwritten', d: 4 })
  })

  it('should return the second object when the first object is null', () => {
    const obj2 = { a: 1, b: 2 }
    expect(merge(null, obj2)).toEqual(obj2)
  })

  it('should return the first object when the second object is null', () => {
    const obj1 = { a: 1, b: 2 }
    expect(merge(obj1, null)).toEqual(null)
  })

  it('should return the second object when the first object is a non-object type (e.g., string)', () => {
    const obj2 = { a: 1 }
    expect(merge('some-string' as any, obj2)).toEqual(obj2)
  })

  it('should return the second object when it is a non-object type', () => {
    const obj1 = { a: 1 }
    expect(merge(obj1, 42 as any)).toEqual(42)
  })

  it('should return a new object reference', () => {
    const obj1 = { a: 1 }
    const obj2 = { b: 2 }
    const result = merge(obj1, obj2)

    expect(result).not.toBe(obj1)
    expect(result).not.toBe(obj2)
  })

  it('should handle merging with an empty object correctly', () => {
    const obj = { x: 99 }
    expect(merge({}, obj)).toEqual(obj)
    expect(merge(obj, {})).toEqual(obj)
  })
})
