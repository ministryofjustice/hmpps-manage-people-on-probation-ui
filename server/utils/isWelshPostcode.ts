export const isWelshPostcode = (postcode: string): boolean => {
  if (!postcode || postcode?.length < 2) return false
  const welshAreas = ['CF', 'HR', 'LD', 'LL', 'NP', 'SA', 'SY']
  const area = postcode.substring(0, 2).toUpperCase()
  return welshAreas.includes(area)
}
