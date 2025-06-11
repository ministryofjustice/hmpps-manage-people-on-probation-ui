import { Need } from '../data/model/risk'
import { isRisk } from './isRisk'
import { needs } from './mocks'

describe('utils/isRisk', () => {
  it('should return true if need severity is not undefined', () => {
    expect(isRisk(needs)).toEqual(true)
  })
  it('should return false if need severity is undefined', () => {
    const mock: Need[] = [{ ...needs[0], severity: undefined }]
    expect(isRisk(mock)).toEqual(false)
  })
})
