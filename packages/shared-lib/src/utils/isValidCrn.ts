export const isValidCrn = (crn: string): boolean => {
  return /^[A-Z]\d{6}$/.test(crn)
}
