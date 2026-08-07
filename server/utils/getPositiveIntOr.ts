export const getPositiveIntOr = (name: string, fallback: number): number => {
  const raw = process.env[name]
  const parsed = Number.parseInt(raw ?? String(fallback), 10)
  return parsed > 0 ? parsed : fallback
}
