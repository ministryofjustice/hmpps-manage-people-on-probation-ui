export const riskLevelLabel = (level: string) => {
  switch (level) {
    case 'VERY_HIGH':
      return 'Very high'
    case 'HIGH':
      return 'High'
    case 'MEDIUM':
      return 'Medium'
    case 'LOW':
      return 'Low'
    default:
      return level
  }
}
