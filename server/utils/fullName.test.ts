import { fullName } from './fullName'
import { Name } from '../data/model/common'

describe('utils/fullName', () => {
  it.each([
    ['empty string', undefined, ''],
    ['empty string', null, ''],
    ['a full name', { forename: 'John', surname: 'Smith' }, 'John Smith'],
  ])('it should return %s', (_: string, a: Name, expected: string) => {
    expect(fullName(a)).toEqual(expected)
  })
})
