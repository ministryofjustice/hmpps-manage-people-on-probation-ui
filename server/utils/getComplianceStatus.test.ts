import { getComplianceStatus } from './getComplianceStatus'

describe('utils/getComplianceStatus', () => {
  it.each([
    ['Returns breach in progress', 2, true, { text: 'Breach in progress', panelClass: 'app-compliance-panel--red' }],
    [
      'Returns failure to comply',
      2,
      false,
      {
        text: '2 failures to comply within 12 months. No breach in progress yet.',
        panelClass: 'app-compliance-panel--red',
      },
    ],
  ])('%s timeFromTo(%s, %s)', (_: string, a: number, b: boolean, expected: { text: string; panelClass: string }) => {
    expect(getComplianceStatus(a, b)).toEqual(expected)
  })
})
