import type { SafetyLevel } from '@/types'

export interface SafetyThreshold {
  level: SafetyLevel
  label: string
  min: number
  max: number
  color: string
}

export const SAFETY_THRESHOLDS: SafetyThreshold[] = [
  { level: 'safe',   label: '安全', min: 0,   max: 2,   color: '#22c55e' },
  { level: 'warn',   label: '预警', min: 2,   max: 5,   color: '#eab308' },
  { level: 'alert',  label: '警示', min: 5,   max: 10,  color: '#f97316' },
  { level: 'danger', label: '报警', min: 10,  max: Infinity, color: '#ef4444' },
]

export function getSafetyLevel(rate: number): SafetyLevel {
  if (rate < 2) return 'safe'
  if (rate < 5) return 'warn'
  if (rate < 10) return 'alert'
  return 'danger'
}

export function getSafetyColor(level: SafetyLevel): string {
  return SAFETY_THRESHOLDS.find((t) => t.level === level)?.color ?? '#22c55e'
}

export function getSafetyLabel(level: SafetyLevel): string {
  return SAFETY_THRESHOLDS.find((t) => t.level === level)?.label ?? '安全'
}

export interface ReportSummary {
  totalPoints: number
  exceedPoints: number
  dangerousPoints: number
  totalExceedHours: number
  avgRate: number
}

export function generateConclusion(summary: ReportSummary, weekLabel: string): string {
  const { dangerousPoints, exceedPoints, avgRate } = summary
  if (dangerousPoints > 0) {
    return `${weekLabel}共有 ${dangerousPoints} 个监测点触发红色报警阈值，边坡失稳风险极高，建议立即启动应急处置预案，加密监测频次。`
  }
  if (exceedPoints > 3 || avgRate > 3) {
    return `${weekLabel}共 ${exceedPoints} 个监测点出现超过预警阈值现象，整体平均速率 ${avgRate} mm/天，边坡处于加速变形阶段，建议加强现场巡查并做好预警准备。`
  }
  if (exceedPoints > 0) {
    return `${weekLabel}边坡整体稳定，仅 ${exceedPoints} 个监测点出现短暂预警，持续保持监测即可。`
  }
  return `${weekLabel}所有监测点位移速率均处于安全范围内，边坡整体稳定。`
}
