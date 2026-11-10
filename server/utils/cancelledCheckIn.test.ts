import { isCancelledCheckIn } from './cancelledCheckIn'

describe('utils/cancelledCheckIn', () => {
  const esupervisionId = '7fa85f64-5717-4562-b3fc-2c963f66afa6'

  it.each([
    ['a check in with the cancelled description', { esupervisionId, description: 'Online check in cancelled' }, true],
    ['a differently cased description', { esupervisionId, description: ' online check in Cancelled ' }, true],
    ['a check in with another description', { esupervisionId, description: 'Online check in scheduled' }, false],
    ['a check in with no description', { esupervisionId }, false],
    ['a non check in contact with the description', { description: 'Online check in cancelled' }, false],
    ['no activity', undefined, false],
  ])('returns the expected result for %s', (_, activity, expected) => {
    expect(isCancelledCheckIn(activity)).toBe(expected)
  })
})
