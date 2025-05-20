const sanitise = (id: string): string => (id ? encodeURIComponent(id.replace(/[/\\:]/g, '')) : id)

export const sanitiseId = <T extends string[] | string>(ids: T): T => {
  if (Array.isArray(ids)) {
    return ids.map(id => sanitise(id)) as T
  }
  return sanitise(ids) as T
}
