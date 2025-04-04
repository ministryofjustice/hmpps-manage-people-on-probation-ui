export const toYesNo = (value: boolean) => {
  if (value == null) return 'Not provided'
  if (!value) {
    return 'No'
  }
  return 'Yes'
}
