<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { X, TrendingUp, TrendingDown, Gauge } from 'lucide-vue-next'
import type { MonitorPoint, DisplacementRecord } from '@/types'
import { getSafetyColor, getSafetyLabel, SAFETY_THRESHOLDS } from '@/composables/useSafetyLevel'
import { useMockData } from '@/composables/useMockData'

const props = defineProps<{
  point: MonitorPoint | null
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const { getHistory } = useMockData()

const history = computed<DisplacementRecord[]>(() =>
  props.point ? getHistory(props.point.id) : [],
)

const formatTime = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`
}

function buildOption(): echarts.EChartsOption {
  const data = history.value
  const xData = data.map((d) => formatTime(d.timestamp))
  return {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(11, 18, 32, 0.95)',
      borderColor: '#1e293b',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      trigger: 'axis',
      axisPointer: { type: 'cross', lineStyle: { color: '#475569' } },
    },
    legend: {
      data: ['水平位移(mm)', '垂直位移(mm)', '位移速率(mm/天)'],
      textStyle: { color: '#cbd5e1' },
      top: 0,
      right: 10,
    },
    grid: { left: 50, right: 55, top: 40, bottom: 50 },
    dataZoom: [
      { type: 'inside', startValue: Math.max(0, xData.length - 168), endValue: xData.length - 1 },
      {
        type: 'slider',
        height: 18,
        bottom: 8,
        startValue: Math.max(0, xData.length - 168),
        endValue: xData.length - 1,
        borderColor: '#1e293b',
        textStyle: { color: '#64748b' },
        fillerColor: 'rgba(56,189,248,0.15)',
      },
    ],
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#64748b', fontSize: 10, interval: 'auto' },
      axisTick: { alignWithLabel: true },
    },
    yAxis: [
      {
        type: 'value',
        name: '位移 (mm)',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        axisLine: { show: true, lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      {
        type: 'value',
        name: '速率 (mm/天)',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        axisLine: { show: true, lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '水平位移(mm)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: '#38bdf8' },
        itemStyle: { color: '#38bdf8' },
        data: data.map((d) => d.horizontal),
      },
      {
        name: '垂直位移(mm)',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: '#a78bfa' },
        itemStyle: { color: '#a78bfa' },
        data: data.map((d) => d.vertical),
      },
      {
        name: '位移速率(mm/天)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: '#f97316' },
        itemStyle: { color: '#f97316' },
        data: data.map((d) => d.rate),
        markLine: {
          silent: false,
          symbol: ['none', 'arrow'],
          lineStyle: { type: 'dashed', width: 1.5 },
          data: SAFETY_THRESHOLDS.map((t) => ({
            yAxis: t.max === Infinity ? 10 : t.max,
            name: t.label + '阈值',
            lineStyle: { color: t.color },
            label: {
              formatter: t.label + '线 {b}：{c}mm/天',
              color: t.color,
              fontSize: 10,
            },
          })),
        },
      },
    ],
  }
}

function onResize() {
  chartInstance?.resize()
}

function render() {
  if (!chartInstance || !props.point) return
  chartInstance.setOption(buildOption(), true)
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      setTimeout(() => {
        if (chartRef.value && !chartInstance) {
          chartInstance = echarts.init(chartRef.value)
          window.addEventListener('resize', onResize)
        }
        render()
      }, 50)
    }
  },
)

watch(
  () => props.point,
  () => {
    if (props.visible) render()
  },
)

onMounted(() => {
  if (props.visible && chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    window.addEventListener('resize', onResize)
    render()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div class="relative flex h-[75vh] w-[900px] max-w-[95vw] flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-700 px-6 py-4">
            <div>
              <div class="text-lg font-bold text-slate-100">{{ point?.name }}</div>
              <div class="mt-0.5 text-xs text-slate-400">
                {{ point?.type === 'GNSS' ? 'GNSS位移监测' : '雷达边坡监测' }}{{ ' · ' }}{{ point?.area === 'stope' ? '采场边坡' : '排土场边坡' }}
              </div>
            </div>
            <button
              class="rounded-md p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
              @click="emit('close')"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="grid grid-cols-4 gap-3 border-b border-slate-800 bg-slate-900/50 px-6 py-4">
            <div class="rounded-md border border-slate-700/60 bg-slate-800/60 p-3">
              <div class="text-[11px] text-slate-400">水平位移</div>
              <div class="mt-1 flex items-baseline gap-1">
                <TrendingUp class="h-3.5 w-3.5 text-sky-400" />
                <span class="text-xl font-bold text-sky-400">{{ point?.horizontalDisplacement.toFixed(2) }}</span>
                <span class="text-[11px] text-slate-500">mm</span>
              </div>
            </div>
            <div class="rounded-md border border-slate-700/60 bg-slate-800/60 p-3">
              <div class="text-[11px] text-slate-400">垂直位移</div>
              <div class="mt-1 flex items-baseline gap-1">
                <TrendingDown class="h-3.5 w-3.5 text-violet-400" />
                <span class="text-xl font-bold text-violet-400">{{ point?.verticalDisplacement.toFixed(2) }}</span>
                <span class="text-[11px] text-slate-500">mm</span>
              </div>
            </div>
            <div class="rounded-md border border-slate-700/60 bg-slate-800/60 p-3">
              <div class="text-[11px] text-slate-400">位移速率</div>
              <div class="mt-1 flex items-baseline gap-1">
                <Gauge class="h-3.5 w-3.5" :style="{ color: point ? getSafetyColor(point.level) : '#22c55e' }" />
                <span class="text-xl font-bold" :style="{ color: point ? getSafetyColor(point.level) : '#22c55e' }">{{ point?.displacementRate.toFixed(2) }}</span>
                <span class="text-[11px] text-slate-500">mm/天</span>
              </div>
            </div>
            <div class="rounded-md border border-slate-700/60 bg-slate-800/60 p-3">
              <div class="text-[11px] text-slate-400">安全等级</div>
              <div class="mt-1">
                <span
                  class="inline-flex items-center rounded px-2 py-0.5 text-sm font-bold"
                  :style="{
                    background: point ? getSafetyColor(point.level) + '22' : '#22c55e22',
                    color: point ? getSafetyColor(point.level) : '#22c55e',
                    border: '1px solid ' + (point ? getSafetyColor(point.level) : '#22c55e') + '55',
                  }"
                >
                  {{ point ? getSafetyLabel(point.level) : '安全' }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex-1 px-6 py-4">
            <div class="mb-2 text-xs font-medium text-slate-400">近 30 天位移-时间曲线（虚线为报警阈值线）</div>
            <div ref="chartRef" class="h-full min-h-[380px] w-full" />
          </div>

          <div class="border-t border-slate-800 px-6 py-3 text-right text-[11px] text-slate-500">
            最近更新：{{ point ? new Date(point.updatedAt).toLocaleString() : '-' }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
