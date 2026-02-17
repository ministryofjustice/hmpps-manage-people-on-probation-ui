import getKeypath from 'lodash/get'

export const getDataValue = <T = any>(data: any, sections: any): T => {
  const path = Array.isArray(sections) ? sections : [sections]
  return getKeypath(data, path.map((s: any) => `["${s}"]`).join(''))
}
