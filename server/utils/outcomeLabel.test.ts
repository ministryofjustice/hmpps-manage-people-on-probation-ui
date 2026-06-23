import { toOutcomeLabel } from './outcomeLabel'

describe('utils/toOutcomeLabel', () => {
  it('returns the mapped label for a known system label', () => {
    expect(toOutcomeLabel('Home Visit Approved')).toEqual('Home visit approved')
  })

  it('returns the mapped label case-insensitively', () => {
    expect(toOutcomeLabel('home visit approved')).toEqual('Home visit approved')
  })

  it('returns the mapped label when system label differs significantly from display label', () => {
    expect(toOutcomeLabel('Delay of home visit')).toEqual('Home visit delayed')
    expect(toOutcomeLabel('Home Visit Not Undertaken')).toEqual('Home visit not carried out')
    expect(toOutcomeLabel('Non-natural: Road Traffic Accident')).toEqual('Unnatural - road traffic accident')
  })

  it('returns the original value when not found in the map', () => {
    expect(toOutcomeLabel('Some unknown outcome')).toEqual('Some unknown outcome')
  })

  it('returns the value unchanged when empty string', () => {
    expect(toOutcomeLabel('')).toEqual('')
  })
})
