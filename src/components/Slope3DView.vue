<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl'
import type { MonitorPoint } from '@/types'
import { getSafetyColor } from '@/composables/useSafetyLevel'

const props = defineProps<{
  points: MonitorPoint[]
}>()

const emit = defineEmits<{
  (e: 'point-click', point: MonitorPoint): void
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function buildSurfaceData(offsetX: number, offsetY: number, radius: number, depth: number) {
  const data: [number, number, number][] = []
  const step = 3
  for (let x = -radius; x <= radius; x += step) {
    for (let y = -radius; y <= radius; y += step) {
      const r = Math.sqrt(x * x + y * y)
      let z = 0
      if (r < radius) {
        const steps = Math.floor(r / 15)
        z = depth * (1 - r / radius) + steps * 2.5 + Math.sin(x * 0.15) * 1.2 + Math.cos(y * 0.15) * 1.2
      }
      data.push([x + offsetX, y + offsetY, z])
    }
  }
  return data
}

function buildOption(): any {
  const stopeSurface = buildSurfaceData(0, -45, 80, 45)
  const dumpSurface = buildSurfaceData(0, 60, 75, 40)

  const scatterData = props.points.map((p) => ({
    name: p.name,
    value: [...p.position, p.displacementRate],
    itemStyle: {
      color: getSafetyColor(p.level),
      opacity: 0.95,
    },
    pointData: p,
  }))

  return {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(11, 18, 32, 0.92)',
      borderColor: '#1e293b',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: (params: any) => {
        if (params.seriesType !== 'scatter3D') return ''
        const p = params.data.pointData as MonitorPoint
        return `
          <div style="font-weight:600;margin-bottom:6px;color:#38bdf8">${p.name}</div>
          <div>类型：${p.type === 'GNSS' ? 'GNSS位移计' : '雷达监测'}</div>
          <div>区域：${p.area === 'stope' ? '采场边坡' : '排土场边坡'}</div>
          <div>水平位移：<b>${p.horizontalDisplacement.toFixed(2)}</b> mm</div>
          <div>垂直位移：<b>${p.verticalDisplacement.toFixed(2)}</b> mm</div>
          <div>位移速率：<b style="color:${getSafetyColor(p.level)}">${p.displacementRate.toFixed(2)}</b> mm/天</div>
          <div style="margin-top:4px;color:#94a3b8;font-size:11px">点击查看近30天趋势</div>
        `
      },
    },
    legend3D: { show: false },
    xAxis3D: {
      type: 'value',
      min: -100,
      max: 100,
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    yAxis3D: {
      type: 'value',
      min: -100,
      max: 100,
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    zAxis3D: {
      type: 'value',
      min: 0,
      max: 60,
      name: '高程',
      nameTextStyle: { color: '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1e293b' } },
    },
    grid3D: {
      boxWidth: 180,
      boxDepth: 180,
      boxHeight: 60,
      viewControl: {
        autoRotate: false,
        distance: 220,
        alpha: 25,
        beta: 40,
        panSensitivity: 1,
        rotateSensitivity: 1,
        zoomSensitivity: 1,
      },
      light: {
        main: { intensity: 1.2, shadow: false, alpha: 40, beta: 40 },
        ambient: { intensity: 0.4 },
      },
      postEffect: {
        enable: false,
      },
      environment: '#0B1220',
    },
    series: [
      {
        type: 'surface',
        name: '采场边坡',
        wireframe: { show: false },
        shading: 'realistic',
        realisticMaterial: { roughness: 0.85, metalness: 0.05 },
        itemStyle: {
          color: (params: any) => {
            const z = params.value[2]
            const t = Math.min(1, Math.max(0, z / 50))
            const r = Math.round(50 + t * 60)
            const g = Math.round(70 + t * 50)
            const b = Math.round(90 + t * 40)
            return `rgb(${r},${g},${b})`
          },
        },
        data: stopeSurface,
      },
      {
        type: 'surface',
        name: '排土场边坡',
        wireframe: { show: false },
        shading: 'realistic',
        realisticMaterial: { roughness: 0.85, metalness: 0.05 },
        itemStyle: {
          color: (params: any) => {
            const z = params.value[2]
            const t = Math.min(1, Math.max(0, z / 50))
            const r = Math.round(90 + t * 60)
            const g = Math.round(70 + t * 40)
            const b = Math.round(50 + t * 30)
            return `rgb(${r},${g},${b})`
          },
        },
        data: dumpSurface,
      },
      {
        type: 'scatter3D',
        name: '监测点',
        symbolSize: 18,
        emphasis: {
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
          },
          scale: 1.4,
        },
        data: scatterData,
      },
    ],
  }
}

function onResize() {
  chartInstance?.resize()
}

function handleClick(params: any) {
  if (params.seriesType === 'scatter3D' && params.data?.pointData) {
    emit('point-click', params.data.pointData as MonitorPoint)
  }
}

function render() {
  if (!chartInstance) return
  chartInstance.setOption(buildOption(), true)
}

onMounted(() => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  chartInstance.on('click', handleClick)
  render()
  window.addEventListener('resize', onResize)
})

watch(
  () => props.points,
  () => render(),
  { deep: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <div class="relative h-full w-full">
    <div ref="chartRef" class="h-full w-full" />
    <div class="pointer-events-none absolute left-4 bottom-4 rounded-md border border-slate-700/60 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 backdrop-blur">
      <div class="mb-1 font-semibold text-sky-400">区域图例</div>
      <div class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded" style="background:#5f8bb0"></span>采场边坡</div>
      <div class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded" style="background:#b08766"></span>排土场边坡</div>
    </div>
    <div class="pointer-events-none absolute right-4 bottom-4 rounded-md border border-slate-700/60 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 backdrop-blur">
      <div class="mb-1 font-semibold text-sky-400">操作提示</div>
      <div>鼠标拖拽：旋转视角</div>
      <div>滚轮：缩放</div>
      <div>右键拖拽：平移</div>
    </div>
  </div>
</template>
