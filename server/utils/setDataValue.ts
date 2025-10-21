export const setDataValue = <T extends Record<string, any>>(data: T, sections: string | string[], value: any): T => {
  const path = Array.isArray(sections) ? sections : [sections]
  let target: Record<string, any> = data
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i]
    if (!target?.[key] || typeof target[key] !== 'object') {
      target[key] = {}
    }
    target = target[key]
  }
  target[path.at(-1)] = value
  return data
}
