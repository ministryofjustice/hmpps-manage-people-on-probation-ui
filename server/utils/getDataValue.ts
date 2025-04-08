import getKeypath from 'lodash/get'

export const getDataValue = (data: any, sections: any) => {
  const path = Array.isArray(sections) ? sections : [sections]
  return getKeypath(data, path.map((s: any) => `["${s}"]`).join(''))
}
