export const merge = (obj1: Record<string, any> | null, obj2: Record<string, any> | null) => {
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return obj2
  }

  return { ...obj1, ...obj2 }
}
