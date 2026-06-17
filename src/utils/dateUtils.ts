export interface NaturalWeekRange {
  start: number
  end: number
  label: string
  startDate: Date
  endDate: Date
}

export function getNaturalWeekRange(weekOffset: number, now?: Date): NaturalWeekRange {
  const baseDate = now ?? new Date()
  const day = baseDate.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const thisMonday = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + diffToMonday - weekOffset * 7,
  )
  const nextMonday = new Date(thisMonday.getTime() + 7 * 24 * 3600 * 1000)
  const end = nextMonday.getTime() - 1
  const endDate = new Date(end)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return {
    start: thisMonday.getTime(),
    end,
    label: `${fmt(thisMonday)} ~ ${fmt(endDate)}`,
    startDate: thisMonday,
    endDate,
  }
}

export function getWeekLabel(weekOffset: number): string {
  switch (weekOffset) {
    case 0: return '本周'
    case 1: return '上周'
    case 2: return '前两周'
    case 3: return '前三周'
    default: return `${weekOffset}周前`
  }
}
