import { defaultFormSelectValues } from './defaultFormSelectValues'
import { CaseSearchFilter } from '../data/model/caseload'

const caseSearchFilter: CaseSearchFilter = {
  nameOrCrn: 'crn',
  sentenceCode: 'ABC',
  nextContactCode: 'DEF',
}

const selectObject = {
  id: '',
  name: '',
  items: [
    { value: 'ABC', selected: '' },
    { value: 'DEF', selected: '' },
  ],
} as unknown as HTMLSelectElement

describe('utils/defaultFormSelectValues', () => {
  it('should return the populated select object', () => {
    expect(defaultFormSelectValues(selectObject, caseSearchFilter, 'sentenceCode')).toEqual({
      id: 'sentenceCode',
      name: 'sentenceCode',
      items: [
        { value: 'ABC', selected: 'selected' },
        { value: 'DEF', selected: '' },
      ],
    })
  })
  it('should return the select object if data is undefined', () => {
    expect(defaultFormSelectValues(selectObject, undefined, 'sentenceCode')).toEqual(selectObject)
  })
})
