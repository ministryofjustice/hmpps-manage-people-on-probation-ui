export const isEmptyObject = (val: unknown) => {
  if (!val) {
    return true
  }
  for (const value of Object.values(val)) {
    if (value) {
      return false
    }
  }
  return true
}
