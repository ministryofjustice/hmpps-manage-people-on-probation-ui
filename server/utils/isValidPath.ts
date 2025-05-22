export const isValidPath = (path: string): boolean => {
  const pathRegex = /^\/?([a-zA-Z0-9]+\/)*[a-zA-Z0-9]+\/?$/
  return pathRegex.test(path)
}
