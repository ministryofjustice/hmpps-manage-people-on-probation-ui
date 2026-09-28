export const addReplaceBackParameter = (url: string, backParam: string) => {
  if (url.includes('back=')) {
    return url.replace(/back=[^&]*/, backParam)
  }
  return `${url}${url.includes('?') ? '&' : '?'}${backParam}`
}
