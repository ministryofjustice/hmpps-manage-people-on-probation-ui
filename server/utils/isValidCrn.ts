export const isValidCrn = (crn: string): boolean => {
  return /^[A-Z][0-9]{6}$/.test(crn)
}
