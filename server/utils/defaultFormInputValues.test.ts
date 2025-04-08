import { CaseSearchFilter } from '../data/model/caseload'
import { defaultFormInputValues } from './defaultFormInputValues'

const caseSearchFilter: CaseSearchFilter = {
  nameOrCrn: 'crn',
  sentenceCode: 'ABC',
  nextContactCode: 'DEF',
}

const mockObject = { id: '', name: '', value: '' } as HTMLInputElement

describe('utils/defaultFormInputValues', () => {
  it('should return the populated object', () => {
    expect(defaultFormInputValues(mockObject, caseSearchFilter, 'sentenceCode')).toEqual({
      id: 'sentenceCode',
      name: 'sentenceCode',
      value: 'ABC',
    })
  })
  it('should return the object if data is undefined', () => {
    expect(defaultFormInputValues(mockObject, undefined, 'sentenceCode')).toEqual(mockObject)
  })
})
