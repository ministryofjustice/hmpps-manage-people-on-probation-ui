import getKeypath from 'lodash/get'

export const getDataValue = <T = unknown>(data: unknown, sections: unknown): T => {
  const path = Array.isArray(sections) ? sections : [sections]
  return getKeypath(data, path.map((s: unknown) => `["${s}"]`).join(''))
}
