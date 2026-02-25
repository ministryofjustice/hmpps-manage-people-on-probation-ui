export const concat = (arr: string[], value: string) => {
  if (!Array.isArray(arr)) {
    throw new Error('First argument must be an array')
  }
  return arr.concat(value)
}
