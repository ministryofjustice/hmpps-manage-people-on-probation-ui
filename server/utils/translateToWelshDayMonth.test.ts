import { translateToWelshDayMonth } from './translateToWelshDayMonth'

describe('utils/translateToWelshDayMonth', () => {
  it.each([
    ['an empty string', ''],
    ['undefined', undefined],
    ['null', null],
  ])('it should return an empty string if argument is %s', (_: string, arg: string) => {
    expect(translateToWelshDayMonth(arg)).toEqual('')
  })
})
