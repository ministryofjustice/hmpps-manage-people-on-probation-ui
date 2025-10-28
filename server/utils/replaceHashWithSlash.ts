export function replaceHashWithSlash(source: string | null | undefined): string | null {
  if (source === null || source === undefined) return null
  const input = String(source)
  if (!input.includes('#')) return input
  // Replace attribute values that equal exactly '#', preserving the quote style
  return input.replace(/=(['"])#\1/g, '=$1/$1')
}

export default replaceHashWithSlash
