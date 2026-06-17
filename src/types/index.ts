export type MonitorType = 'GNSS' | 'Radar'
export type SlopeArea = 'stope' | 'dump'
export type SafetyLevel = 'safe' | 'warn' | 'alert' | 'danger'

export interface MonitorPoint {
  id: string
  name: string
  type: MonitorType
  area: SlopeArea
  position: [number, number, number]
  horizontalDisplacement: number
  verticalDisplacement: number
  displacementRate: number
  level: SafetyLevel
  updatedAt: string
}

export interface DisplacementRecord {
  timestamp: string
  horizontal: number
  vertical: number
  rate: number
}

export interface SafetyThreshold {
  level: SafetyLevel
  label: string
  min: number
  max: number
  color: string
}
