import { Name } from '../data/model/personalDetails'
import { firstInitialLastName } from './firstInitialLastName'

describe('utils/firstInitialLastName', () => {
  it.each([
    ['empty string', undefined, ''],
    ['empty string', null, ''],
    ['a First Initial last name', { forename: 'John', surname: 'Smith' }, 'J. Smith'],
    ['a First Initial last name', { forename: 'john', surname: 'Smith' }, 'J. Smith'],
  ])('it should return %s', (_: string, a: Name, expected: string) => {
    expect(firstInitialLastName(a)).toEqual(expected)
  })
})
