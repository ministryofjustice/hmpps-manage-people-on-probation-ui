export const merge = (obj1: Record<string, unknown> | null, obj2: Record<string, unknown> | null) => {
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return obj2
  }

  return { ...obj1, ...obj2 }
}
