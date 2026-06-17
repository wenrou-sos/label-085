import type { SafetyLevel, SafetyThreshold } from '@/types'

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
