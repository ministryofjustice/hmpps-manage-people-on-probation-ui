export const setSortOrder = (columnName: string, sortBy: string) => {
  if (!sortBy) {
    return 'none'
  }
  const colName = sortBy.split('.')[0]
  const sortOrder = sortBy.split('.')[1]
  if (colName === columnName) {
    if (sortOrder === 'desc') {
      return 'descending'
    }
    return 'ascending'
  }
  return 'none'
}
