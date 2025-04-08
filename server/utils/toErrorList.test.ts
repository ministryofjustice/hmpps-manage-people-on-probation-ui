import { toErrorList } from './toErrorList'

const errorMessages = { startDate: 'Enter or select a start date.', firstName: 'Enter a first name.' }

describe('utils/toErrorList', () => {
  it('should', () => {
    expect(toErrorList(errorMessages)).toEqual([
      {
        text: 'Enter or select a start date.',
        href: `#startDate`,
      },
      {
        text: 'Enter a first name.',
        href: `#firstName`,
      },
    ])
  })
})
