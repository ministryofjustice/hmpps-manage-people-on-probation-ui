import { CaseSearchFilter } from '../data/model/caseload'

export const defaultFormInputValues = (
  object: HTMLInputElement,
  data: CaseSearchFilter,
  id: string,
): HTMLInputElement => {
  const obj = object
  if (data !== undefined) {
    obj.id = id
    obj.name = id
    obj.value = data[id]
  }
  return obj
}
