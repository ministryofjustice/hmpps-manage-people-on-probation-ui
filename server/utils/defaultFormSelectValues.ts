/* eslint-disable no-param-reassign */
import { CaseSearchFilter, SelectElement } from '../data/model/caseload'

export const defaultFormSelectValues = (object: SelectElement, data: CaseSearchFilter, id: string): SelectElement => {
  const obj = object
  if (data !== undefined) {
    obj.id = id
    obj.name = id

    obj.items?.forEach(item => {
      if (item.value === data[id]) {
        item.selected = 'selected'
      }
    })
  }
  return obj
}
