export const toSentenceCase = (value: string | null | undefined): string => {
  if (!value) return ''
  const val = value.split('_').join(' ').split('-').join(' ')
  return `${val.charAt(0).toUpperCase()}${val.substring(1).toLowerCase()}`
}
