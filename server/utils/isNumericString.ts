export const isNumericString = (str: string): boolean => {
  return /^\d+$/.test(str)
}
