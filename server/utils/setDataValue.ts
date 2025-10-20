export const setDataValue = (data: any, sections: any, value: any) => {
  const path = Array.isArray(sections) ? sections.map(String) : [String(sections)]

  let target = data
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i]
    if (typeof target?.[key] !== 'object' || target?.[key] === null || Array.isArray(target?.[key])) {
      target[key] = {}
    }
    target = target[key]
  }
  target[path[path.length - 1]] = value
  return data
}
