// Non-negative minutes (floor then clamp at 0)
export const getDurationInMinutes = (startDate: Date, endDate: Date): number =>
  Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60)))
