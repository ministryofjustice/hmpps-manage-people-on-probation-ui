import { removeEmpty } from './removeEmpty'

describe('utils/removeEmpty', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const arr: never[] = [{ value: 'a value' }, {}]
  it.each([['Filters empty object', arr, 1]])('%s removeEmpty(%s, %s)', (_: string, a: never[], size: number) => {
    expect(removeEmpty(a).length).toEqual(size)
  })
})
