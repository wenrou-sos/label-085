import { ref, computed } from 'vue'
import type { MonitorPoint, DisplacementRecord, SlopeArea } from '@/types'
import { getSafetyLevel } from './useSafetyLevel'

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function generatePoint(
  id: string,
  name: string,
  type: 'GNSS' | 'Radar',
  area: SlopeArea,
  position: [number, number, number],
  seed: number,
): { point: MonitorPoint; history: DisplacementRecord[] } {
  const rand = seededRandom(seed)
  const now = Date.now()
  const history: DisplacementRecord[] = []
  let h = 0
  let v = 0
  for (let i = 720; i >= 0; i--) {
    const t = now - i * 3600 * 1000
    const baseTrend = (720 - i) / 720
    const anomaly = seed % 5 === 0 && i < 120 ? 1 + (120 - i) / 40 : 1
    const dh = (rand() - 0.35) * 0.15 * anomaly
    const dv = (rand() - 0.4) * 0.1 * anomaly
    h += dh * baseTrend + (seed % 3 === 0 ? 0.005 : 0)
    v += dv * baseTrend
    const rate = Math.abs(dh) * 24 + Math.abs(dv) * 24 + baseTrend * (seed % 7) * 0.3
    history.push({
      timestamp: new Date(t).toISOString(),
      horizontal: +h.toFixed(3),
      vertical: +v.toFixed(3),
      rate: +rate.toFixed(3),
    })
  }
  const latest = history[history.length - 1]
  const point: MonitorPoint = {
    id,
    name,
    type,
    area,
    position,
    horizontalDisplacement: latest.horizontal,
    verticalDisplacement: latest.vertical,
    displacementRate: latest.rate,
    level: getSafetyLevel(latest.rate),
    updatedAt: latest.timestamp,
  }
  return { point, history }
}

const rawData: { point: MonitorPoint; history: DisplacementRecord[] }[] = [
  generatePoint('GNSS-S-01', '采场 GNSS-01', 'GNSS', 'stope', [-60, -40, 25], 11),
  generatePoint('GNSS-S-02', '采场 GNSS-02', 'GNSS', 'stope', [-30, -60, 35], 23),
  generatePoint('GNSS-S-03', '采场 GNSS-03', 'GNSS', 'stope', [0, -70, 42], 7),
  generatePoint('RADAR-S-01', '采场雷达-01', 'Radar', 'stope', [30, -55, 38], 41),
  generatePoint('RADAR-S-02', '采场雷达-02', 'Radar', 'stope', [60, -30, 30], 55),
  generatePoint('GNSS-D-01', '排土场 GNSS-01', 'GNSS', 'dump', [-50, 50, 28], 67),
  generatePoint('GNSS-D-02', '排土场 GNSS-02', 'GNSS', 'dump', [0, 65, 33], 89),
  generatePoint('GNSS-D-03', '排土场 GNSS-03', 'GNSS', 'dump', [50, 55, 30], 103),
  generatePoint('RADAR-D-01', '排土场雷达-01', 'Radar', 'dump', [25, 70, 36], 127),
  generatePoint('RADAR-D-02', '排土场雷达-02', 'Radar', 'dump', [-25, 72, 34], 149),
]

const points = ref<MonitorPoint[]>(rawData.map((d) => d.point))
const historyMap = new Map<string, DisplacementRecord[]>(
  rawData.map((d) => [d.point.id, d.history]),
)

export function useMockData() {
  const stopePoints = computed(() => points.value.filter((p) => p.area === 'stope'))
  const dumpPoints = computed(() => points.value.filter((p) => p.area === 'dump'))

  const levelCounts = computed(() => ({
    safe: points.value.filter((p) => p.level === 'safe').length,
    warn: points.value.filter((p) => p.level === 'warn').length,
    alert: points.value.filter((p) => p.level === 'alert').length,
    danger: points.value.filter((p) => p.level === 'danger').length,
  }))

  const latestUpdate = computed(() =>
    points.value.reduce((m, p) => (p.updatedAt > m ? p.updatedAt : m), ''),
  )

  function getHistory(pointId: string): DisplacementRecord[] {
    return historyMap.get(pointId) ?? []
  }

  function getWeeklyReportData(weekOffset = 0) {
    const end = Date.now() - weekOffset * 7 * 24 * 3600 * 1000
    const start = end - 7 * 24 * 3600 * 1000
    return points.value.map((p) => {
      const hist = (historyMap.get(p.id) ?? []).filter((r) => {
        const t = new Date(r.timestamp).getTime()
        return t >= start && t <= end
      })
      const rates = hist.map((h) => h.rate)
      const avgRate = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0
      const maxRate = rates.length ? Math.max(...rates) : 0
      const exceedCount = rates.filter((r) => r >= 2).length
      const latest = hist[hist.length - 1]
      return {
        point: p,
        avgRate: +avgRate.toFixed(3),
        maxRate: +maxRate.toFixed(3),
        exceedCount,
        totalHours: hist.length,
        finalHorizontal: latest?.horizontal ?? 0,
        finalVertical: latest?.vertical ?? 0,
      }
    })
  }

  return {
    points,
    stopePoints,
    dumpPoints,
    levelCounts,
    latestUpdate,
    getHistory,
    getWeeklyReportData,
  }
}
