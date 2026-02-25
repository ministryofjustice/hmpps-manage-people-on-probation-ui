/**
 * 09:00 → 9am
 * 09:30 → 9:30am (minutes kept only if non-zero)
 */
export const to12HourTimeCompact = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'pm' : 'am'
  const hour12 = hours % 12 || 12

  return minutes === 0 ? `${hour12}${period}` : `${hour12}:${minutes.toString().padStart(2, '0')}${period}`
}
