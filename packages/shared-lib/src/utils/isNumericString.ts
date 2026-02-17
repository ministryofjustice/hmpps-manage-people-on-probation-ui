export const isNumericString = (str: string): boolean => {
  if (!str) return false
  return /^\d+$/.test(str)
}
