import { deliusDateFormat } from './deliusDateFormat'

describe('deliusDateFormat', () => {
  it.each([
    ['an empty string if date is undefined', undefined, ''],
    ['an empty string if date is null', null, ''],
    ['an empty string if date is an empty string', '', ''],
    ['a delius format date', '2024-08-25T09:08:34.123', '25/08/2024'],
  ])('it should return %s', (_: string, a: string, expected: null) => {
    expect(deliusDateFormat(a)).toEqual(expected)
  })
})
