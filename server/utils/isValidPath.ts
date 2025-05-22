export const isValidPath = (path: string): boolean => {
  const pathRegex = /^\/?([a-zA-Z]+\/)*[a-zA-Z]+\/?$/
  return pathRegex.test(path)
}
