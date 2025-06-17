export const isEmptyObject = (val: unknown) => {
  for (const value of Object.values(val)) {
    if (value) {
      return false
    }
  }
  return true
}
