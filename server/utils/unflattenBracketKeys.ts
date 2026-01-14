export function unflattenBracketKeys(flat: Record<string, any>): Record<string, any> {
  const nested: Record<string, any> = {}
  Object.entries(flat || {}).forEach(([rawKey, value]) => {
    // Pass through normal keys (non-bracket notation)
    if (!rawKey.startsWith('[') || !rawKey.includes(']')) {
      nested[rawKey] = value
      return
    }
    const parts = rawKey
      .split(']')
      .filter(Boolean)
      .map(k => k.replace(/^\[/, ''))

    let cursor = nested
    parts.forEach((part, idx) => {
      const isLeaf = idx === parts.length - 1
      if (isLeaf) {
        cursor[part] = value
      } else {
        if (typeof cursor[part] !== 'object' || cursor[part] === null) cursor[part] = {}
        cursor = cursor[part]
      }
    })
  })
  return nested
}
