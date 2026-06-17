import { describe, it, expect } from 'vitest'
import { getWeekLabel, getNaturalWeekRange } from '../src/utils/dateUtils'

describe('getWeekLabel', () => {
  it('weekOffset 0 → "本周"', () => {
    expect(getWeekLabel(0)).toBe('本周')
  })

  it('weekOffset 1 → "上周"', () => {
    expect(getWeekLabel(1)).toBe('上周')
  })

  it('weekOffset 2 → "前两周"', () => {
    expect(getWeekLabel(2)).toBe('前两周')
  })

  it('weekOffset 3 → "前三周"', () => {
    expect(getWeekLabel(3)).toBe('前三周')
  })

  it('weekOffset >= 4 → "N周前"', () => {
    expect(getWeekLabel(4)).toBe('4周前')
    expect(getWeekLabel(10)).toBe('10周前')
  })
})

describe('getNaturalWeekRange', () => {
  it('周三 (2026-06-17) 的本周应为 6/15(周一) ~ 6/21(周日)', () => {
    const now = new Date(2026, 5, 17, 14, 30, 0)
    const range = getNaturalWeekRange(0, now)

    expect(range.startDate.getFullYear()).toBe(2026)
    expect(range.startDate.getMonth()).toBe(5)
    expect(range.startDate.getDate()).toBe(15)
    expect(range.startDate.getDay()).toBe(1)

    expect(range.endDate.getDate()).toBe(21)
    expect(range.endDate.getDay()).toBe(0)
    expect(range.endDate.getHours()).toBe(23)
    expect(range.endDate.getMinutes()).toBe(59)
    expect(range.endDate.getSeconds()).toBe(59)

    expect(range.label).toBe('2026-06-15 ~ 2026-06-21')
  })

  it('周日 (2026-06-21) 的本周应为 6/15 ~ 6/21（处理 day=0 边界）', () => {
    const now = new Date(2026, 5, 21, 10, 0, 0)
    const range = getNaturalWeekRange(0, now)

    expect(range.startDate.getDate()).toBe(15)
    expect(range.endDate.getDate()).toBe(21)
    expect(range.startDate.getDay()).toBe(1)
    expect(range.endDate.getDay()).toBe(0)
  })

  it('周一 (2026-06-15) 的本周应为 6/15 ~ 6/21', () => {
    const now = new Date(2026, 5, 15, 0, 0, 0)
    const range = getNaturalWeekRange(0, now)

    expect(range.startDate.getDate()).toBe(15)
    expect(range.endDate.getDate()).toBe(21)
  })

  it('weekOffset=1 上周应为 6/8 ~ 6/14', () => {
    const now = new Date(2026, 5, 17, 14, 30, 0)
    const range = getNaturalWeekRange(1, now)

    expect(range.startDate.getDate()).toBe(8)
    expect(range.endDate.getDate()).toBe(14)
    expect(range.label).toBe('2026-06-08 ~ 2026-06-14')
  })

  it('weekOffset=2 前两周应为 6/1 ~ 6/7', () => {
    const now = new Date(2026, 5, 17, 14, 30, 0)
    const range = getNaturalWeekRange(2, now)

    expect(range.startDate.getDate()).toBe(1)
    expect(range.endDate.getDate()).toBe(7)
    expect(range.label).toBe('2026-06-01 ~ 2026-06-07')
  })

  it('跨月边界：2026-07-01 周三 → 本周应为 6/29 ~ 7/5', () => {
    const now = new Date(2026, 6, 1, 14, 30, 0)
    const range = getNaturalWeekRange(0, now)

    expect(range.startDate.getFullYear()).toBe(2026)
    expect(range.startDate.getMonth()).toBe(5)
    expect(range.startDate.getDate()).toBe(29)

    expect(range.endDate.getFullYear()).toBe(2026)
    expect(range.endDate.getMonth()).toBe(6)
    expect(range.endDate.getDate()).toBe(5)

    expect(range.label).toBe('2026-06-29 ~ 2026-07-05')
  })

  it('跨年边界：2026-01-01 周四 → 本周应为 12/29 ~ 1/4', () => {
    const now = new Date(2026, 0, 1, 14, 30, 0)
    const range = getNaturalWeekRange(0, now)

    expect(range.startDate.getFullYear()).toBe(2025)
    expect(range.startDate.getMonth()).toBe(11)
    expect(range.startDate.getDate()).toBe(29)

    expect(range.endDate.getFullYear()).toBe(2026)
    expect(range.endDate.getMonth()).toBe(0)
    expect(range.endDate.getDate()).toBe(4)

    expect(range.label).toBe('2025-12-29 ~ 2026-01-04')
  })

  it('end 时间戳 = 下周一 00:00 - 1ms', () => {
    const now = new Date(2026, 5, 17, 14, 30, 0)
    const range = getNaturalWeekRange(0, now)

    const nextMonday = new Date(2026, 5, 22, 0, 0, 0, 0)
    expect(range.end).toBe(nextMonday.getTime() - 1)
  })

  it('日期格式为 YYYY-MM-DD，月日补零', () => {
    const now = new Date(2026, 0, 2, 14, 30, 0)
    const range = getNaturalWeekRange(0, now)
    expect(range.label).toBe('2025-12-29 ~ 2026-01-04')
  })
})
