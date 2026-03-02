export const formattedDate = (input: string): string => {
  if (!input) return ''

  const [day, month, year] = input.split('/')

  if (!day || !month || !year) {
    throw new Error(`Invalid date format. Expected D/M/YYYY but received: ${input}`)
  }

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}
