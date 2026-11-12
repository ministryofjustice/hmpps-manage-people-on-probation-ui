export const swapNameOrder = (name: string = '') =>
  name
    .split(',')
    .map(n => n.trim())
    .reverse()
    .join(' ')
