export const toYesNo = (value: boolean, nullIsNo = false) => {
  if (!nullIsNo && value == null) return 'Not provided'
  if (!value) {
    return 'No'
  }
  return 'Yes'
}
