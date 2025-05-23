export const isValidPath = (path: string): boolean => {
  const pathRegex = /^\/?(?:[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*)?(?:\?[a-zA-Z0-9_=&%-]*)?\/?$/
  return pathRegex.test(path)
}
