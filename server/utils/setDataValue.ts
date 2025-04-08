import setKeypath from 'lodash/set'

export const setDataValue = (data: any, sections: any, value: any) => {
  const path = Array.isArray(sections) ? sections : [sections]
  return setKeypath(data, path.map((s: any) => `["${s}"]`).join(''), value)
}
