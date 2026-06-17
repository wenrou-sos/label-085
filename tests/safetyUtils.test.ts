import { describe, it, expect } from 'vitest'
import {
  getSafetyLevel,
  getSafetyColor,
  getSafetyLabel,
  generateConclusion,
  SAFETY_THRESHOLDS,
} from '../src/utils/safetyUtils'
import type { SafetyLevel } from '../src/types'

describe('getSafetyLevel', () => {
  it('rate < 2 → safe', () => {
    expect(getSafetyLevel(0)).toBe('safe')
    expect(getSafetyLevel(1.99)).toBe('safe')
  })

  it('2 ≤ rate < 5 → warn', () => {
    expect(getSafetyLevel(2)).toBe('warn')
    expect(getSafetyLevel(3.5)).toBe('warn')
    expect(getSafetyLevel(4.99)).toBe('warn')
  })

  it('5 ≤ rate < 10 → alert', () => {
    expect(getSafetyLevel(5)).toBe('alert')
    expect(getSafetyLevel(7.5)).toBe('alert')
    expect(getSafetyLevel(9.99)).toBe('alert')
  })

  it('rate ≥ 10 → danger', () => {
    expect(getSafetyLevel(10)).toBe('danger')
    expect(getSafetyLevel(100)).toBe('danger')
    expect(getSafetyLevel(Infinity)).toBe('danger')
  })
})

describe('getSafetyColor', () => {
  it('映射正确', () => {
    expect(getSafetyColor('safe')).toBe('#22c55e')
    expect(getSafetyColor('warn')).toBe('#eab308')
    expect(getSafetyColor('alert')).toBe('#f97316')
    expect(getSafetyColor('danger')).toBe('#ef4444')
  })

  it('未知 level → 默认安全色', () => {
    expect(getSafetyColor('unknown' as SafetyLevel)).toBe('#22c55e')
  })
})

describe('getSafetyLabel', () => {
  it('映射正确', () => {
    expect(getSafetyLabel('safe')).toBe('安全')
    expect(getSafetyLabel('warn')).toBe('预警')
    expect(getSafetyLabel('alert')).toBe('警示')
    expect(getSafetyLabel('danger')).toBe('报警')
  })

  it('未知 level → 默认"安全"', () => {
    expect(getSafetyLabel('unknown' as SafetyLevel)).toBe('安全')
  })
})

describe('SAFETY_THRESHOLDS', () => {
  it('四级阈值定义完整', () => {
    expect(SAFETY_THRESHOLDS).toHaveLength(4)
    expect(SAFETY_THRESHOLDS[0].level).toBe('safe')
    expect(SAFETY_THRESHOLDS[0].max).toBe(2)
    expect(SAFETY_THRESHOLDS[1].min).toBe(2)
    expect(SAFETY_THRESHOLDS[1].max).toBe(5)
    expect(SAFETY_THRESHOLDS[2].min).toBe(5)
    expect(SAFETY_THRESHOLDS[2].max).toBe(10)
    expect(SAFETY_THRESHOLDS[3].min).toBe(10)
    expect(SAFETY_THRESHOLDS[3].max).toBe(Infinity)
  })
})

describe('generateConclusion', () => {
  const baseSummary = {
    totalPoints: 10,
    exceedPoints: 0,
    dangerousPoints: 0,
    totalExceedHours: 0,
    avgRate: 1.5,
  }

  describe('分支1：dangerousPoints > 0', () => {
    it('包含"红色报警"文案', () => {
      const summary = { ...baseSummary, dangerousPoints: 2, exceedPoints: 5 }
      const result = generateConclusion(summary, '本周')
      expect(result).toContain('2 个监测点触发红色报警')
      expect(result).toContain('立即启动应急处置预案')
    })
  })

  describe('分支2：exceedPoints > 3 或 avgRate > 3', () => {
    it('exceedPoints > 3', () => {
      const summary = { ...baseSummary, exceedPoints: 4, avgRate: 2.5 }
      const result = generateConclusion(summary, '本周')
      expect(result).toContain('共 4 个监测点出现超过预警阈值')
      expect(result).toContain('加速变形阶段')
      expect(result).toContain('加强现场巡查')
    })

    it('avgRate > 3', () => {
      const summary = { ...baseSummary, exceedPoints: 2, avgRate: 3.14 }
      const result = generateConclusion(summary, '本周')
      expect(result).toContain('3.14 mm/天')
      expect(result).toContain('加速变形阶段')
    })
  })

  describe('分支3：exceedPoints > 0 但未达分支2条件', () => {
    it('仅少量点短暂预警', () => {
      const summary = { ...baseSummary, exceedPoints: 2, avgRate: 2.5 }
      const result = generateConclusion(summary, '本周')
      expect(result).toContain('边坡整体稳定')
      expect(result).toContain('仅 2 个监测点出现短暂预警')
      expect(result).toContain('持续保持监测即可')
    })
  })

  describe('分支4：全部安全', () => {
    it('所有监测点均安全', () => {
      const result = generateConclusion(baseSummary, '本周')
      expect(result).toContain('所有监测点位移速率均处于安全范围内')
      expect(result).toContain('边坡整体稳定')
    })
  })

  describe('周次标签动态替换', () => {
    const summary = { ...baseSummary, exceedPoints: 2, avgRate: 2.5 }

    it('weekLabel = "本周" → 文案含"本周"', () => {
      const result = generateConclusion(summary, '本周')
      expect(result).toContain('本周')
      expect(result).not.toContain('上周')
      expect(result).not.toContain('前两周')
    })

    it('weekLabel = "上周" → 文案含"上周"', () => {
      const result = generateConclusion(summary, '上周')
      expect(result).toContain('上周')
      expect(result).not.toContain('本周')
    })

    it('weekLabel = "前两周" → 文案含"前两周"', () => {
      const result = generateConclusion(summary, '前两周')
      expect(result).toContain('前两周')
      expect(result).not.toContain('本周')
    })

    it('weekLabel = "前三周" → 文案含"前三周"', () => {
      const result = generateConclusion(summary, '前三周')
      expect(result).toContain('前三周')
      expect(result).not.toContain('本周')
    })

    it('完整验证：4个周次 × 4个分支，全不包含"本周"固定字', () => {
      const weekLabels = ['本周', '上周', '前两周', '前三周']
      const summaries = [
        { ...baseSummary, dangerousPoints: 1, exceedPoints: 5 },
        { ...baseSummary, exceedPoints: 5, avgRate: 3.5 },
        { ...baseSummary, exceedPoints: 2, avgRate: 2.5 },
        { ...baseSummary },
      ]

      for (const label of weekLabels) {
        for (const s of summaries) {
          const result = generateConclusion(s, label)
          expect(result).toContain(label)
          expect(result.startsWith(label)).toBe(true)
          expect(result).not.toMatch(/^(?!本周).*本周/) // 不允许"本周"作为非开头字出现
        }
      }
    })
  })
})
