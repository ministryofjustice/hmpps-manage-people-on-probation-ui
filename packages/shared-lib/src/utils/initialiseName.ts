export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null
  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.toReversed()[0]}`
}
