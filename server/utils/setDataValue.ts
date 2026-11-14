export const setDataValue = <TData extends Record<string, unknown>, TValue = unknown>(
  data: TData,
  sections: string | string[],
  value: TValue,
): TData => {
  const path = Array.isArray(sections) ? sections : [sections]
  let target: Record<string, unknown> = data
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i]
    if (!target?.[key] || typeof target[key] !== 'object') {
      target[key] = {}
    }
    target = target[key] as Record<string, unknown>
  }
  target[path.at(-1)!] = value
  return data
}
