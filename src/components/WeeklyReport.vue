<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import { Printer, Calendar, AlertTriangle, ShieldAlert, Shield, AlertCircle } from 'lucide-vue-next'
import { useMockData } from '@/composables/useMockData'
import { getSafetyColor, getSafetyLabel } from '@/composables/useSafetyLevel'

const { getWeeklyReportData } = useMockData()

const weekOffset = ref(0)
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const reportResult = computed(() => getWeeklyReportData(weekOffset.value))
const report = computed(() => reportResult.value.data)
const weekRangeLabel = computed(() => reportResult.value.range.label)

const summary = computed(() => {
  const list = report.value
  const totalPoints = list.length
  const exceedPoints = list.filter((r) => r.exceedCount > 0).length
  const dangerousPoints = list.filter((r) => r.maxRate >= 10).length
  const totalExceedHours = list.reduce((s, r) => s + r.exceedCount, 0)
  const avgRate = list.length ? list.reduce((s, r) => s + r.avgRate, 0) / list.length : 0
  return { totalPoints, exceedPoints, dangerousPoints, totalExceedHours, avgRate: +avgRate.toFixed(3) }
})

const conclusion = computed(() => {
  const { dangerousPoints, exceedPoints, avgRate } = summary.value
  if (dangerousPoints > 0) {
    return `本周共有 ${dangerousPoints} 个监测点触发红色报警阈值，边坡失稳风险极高，建议立即启动应急处置预案，加密监测频次。`
  }
  if (exceedPoints > 3 || avgRate > 3) {
    return `本周共 ${exceedPoints} 个监测点出现超过预警阈值现象，整体平均速率 ${avgRate} mm/天，边坡处于加速变形阶段，建议加强现场巡查并做好预警准备。`
  }
  if (exceedPoints > 0) {
    return `本周边坡整体稳定，仅 ${exceedPoints} 个监测点出现短暂预警，持续保持监测即可。`
  }
  return '本周所有监测点位移速率均处于安全范围内，边坡整体稳定。'
})

function onResize() {
  chartInstance?.resize()
}

function renderChart() {
  if (!chartInstance) return
  const names = report.value.map((r) => r.point.name)
  chartInstance.setOption(
    {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(11, 18, 32, 0.95)',
        borderColor: '#1e293b',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['平均速率(mm/天)', '最大速率(mm/天)'],
        textStyle: { color: '#cbd5e1' },
        top: 0,
        right: 10,
      },
      grid: { left: 50, right: 20, top: 40, bottom: 60 },
      xAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 10, interval: 0, rotate: 20 },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        name: 'mm/天',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        axisLine: { show: true, lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      series: [
        {
          name: '平均速率(mm/天)',
          type: 'bar',
          data: report.value.map((r) => ({
            value: r.avgRate,
            itemStyle: { color: '#38bdf8' },
          })),
          barWidth: '35%',
        },
        {
          name: '最大速率(mm/天)',
          type: 'bar',
          data: report.value.map((r) => ({
            value: r.maxRate,
            itemStyle: {
              color: getSafetyColor(r.weekMaxLevel),
            },
          })),
          barWidth: '35%',
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'dashed', width: 1.5, color: '#ef4444' },
            data: [
              { yAxis: 2, label: { formatter: '预警 2', color: '#eab308', fontSize: 10 } },
              { yAxis: 5, label: { formatter: '警示 5', color: '#f97316', fontSize: 10 } },
              { yAxis: 10, label: { formatter: '报警 10', color: '#ef4444', fontSize: 10 } },
            ],
          },
        },
      ],
    },
    true,
  )
}

watch(weekOffset, () => renderChart())

onMounted(() => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    window.addEventListener('resize', onResize)
    renderChart()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chartInstance?.dispose()
  chartInstance = null
})

function printReport() {
  window.print()
}
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-5 p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-100">边坡监测周报</h2>
        <div class="mt-1 text-xs text-slate-400">
          <Calendar class="mr-1 inline-block h-3.5 w-3.5 text-sky-400" />
          {{ weekRangeLabel }}（自然周，周一至周日）
        </div>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="weekOffset"
          class="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 focus:border-sky-500 focus:outline-none"
        >
          <option :value="0">本周</option>
          <option :value="1">上周</option>
          <option :value="2">前两周</option>
          <option :value="3">前三周</option>
        </select>
        <button
          class="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-700 print:hidden"
          @click="printReport"
        >
          <Printer class="h-4 w-4" />
          打印 / 导出 PDF
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
      <div class="rounded-lg border border-slate-700/60 bg-slate-900/80 p-4">
        <div class="text-[11px] text-slate-400">监测点总数</div>
        <div class="mt-1 text-2xl font-bold text-slate-100">{{ summary.totalPoints }}</div>
      </div>
      <div class="rounded-lg border border-slate-700/60 bg-slate-900/80 p-4">
        <div class="flex items-center gap-1 text-[11px] text-yellow-500">
          <AlertCircle class="h-3.5 w-3.5" />
          预警监测点
        </div>
        <div class="mt-1 text-2xl font-bold text-yellow-400">{{ summary.exceedPoints }}</div>
      </div>
      <div class="rounded-lg border border-slate-700/60 bg-slate-900/80 p-4">
        <div class="flex items-center gap-1 text-[11px] text-red-500">
          <AlertTriangle class="h-3.5 w-3.5" />
          报警监测点
        </div>
        <div class="mt-1 text-2xl font-bold text-red-400">{{ summary.dangerousPoints }}</div>
      </div>
      <div class="rounded-lg border border-slate-700/60 bg-slate-900/80 p-4">
        <div class="flex items-center gap-1 text-[11px] text-orange-500">
          <ShieldAlert class="h-3.5 w-3.5" />
          累计超阈值小时数
        </div>
        <div class="mt-1 text-2xl font-bold text-orange-400">{{ summary.totalExceedHours }}</div>
      </div>
      <div class="rounded-lg border border-slate-700/60 bg-slate-900/80 p-4">
        <div class="flex items-center gap-1 text-[11px] text-emerald-500">
          <Shield class="h-3.5 w-3.5" />
          整体平均速率
        </div>
        <div class="mt-1 text-2xl font-bold text-emerald-400">
          {{ summary.avgRate }} <span class="text-xs font-normal text-slate-400">mm/天</span>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-slate-700/60 bg-slate-900/80 p-4">
      <div class="mb-2 text-sm font-semibold text-sky-400">各监测点周速率统计</div>
      <div ref="chartRef" class="h-[320px] w-full" />
    </div>

    <div class="overflow-hidden rounded-lg border border-slate-700/60 bg-slate-900/80">
      <div class="border-b border-slate-700/60 px-4 py-3 text-sm font-semibold text-sky-400">
        监测点详细数据
      </div>
      <div class="overflow-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-900 text-slate-400">
            <tr class="border-b border-slate-800">
              <th class="px-4 py-2 text-left font-medium">监测点</th>
              <th class="px-4 py-2 text-left font-medium">类型</th>
              <th class="px-4 py-2 text-left font-medium">区域</th>
              <th class="px-4 py-2 text-right font-medium">平均速率(mm/天)</th>
              <th class="px-4 py-2 text-right font-medium">最大速率(mm/天)</th>
              <th class="px-4 py-2 text-right font-medium">超阈值小时数</th>
              <th class="px-4 py-2 text-right font-medium">累计水平位移(mm)</th>
              <th class="px-4 py-2 text-right font-medium">累计垂直位移(mm)</th>
              <th class="px-4 py-2 text-center font-medium">最高等级</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in report" :key="r.point.id" class="border-b border-slate-800 text-slate-300">
              <td class="px-4 py-2 font-medium text-slate-200">{{ r.point.name }}</td>
              <td class="px-4 py-2 text-slate-400">{{ r.point.type }}</td>
              <td class="px-4 py-2 text-slate-400">{{ r.point.area === 'stope' ? '采场' : '排土场' }}</td>
              <td class="px-4 py-2 text-right font-mono">{{ r.avgRate.toFixed(2) }}</td>
              <td
                class="px-4 py-2 text-right font-mono font-bold"
                :style="{ color: getSafetyColor(r.weekMaxLevel) }"
              >
                {{ r.maxRate.toFixed(2) }}
              </td>
              <td class="px-4 py-2 text-right font-mono">{{ r.exceedCount }}</td>
              <td class="px-4 py-2 text-right font-mono">{{ r.finalHorizontal.toFixed(2) }}</td>
              <td class="px-4 py-2 text-right font-mono">{{ r.finalVertical.toFixed(2) }}</td>
              <td class="px-4 py-2 text-center">
                <span
                  class="inline-block rounded px-2 py-0.5 text-[10px] font-semibold"
                  :style="{
                    background: getSafetyColor(r.weekMaxLevel) + '22',
                    color: getSafetyColor(r.weekMaxLevel),
                    border: '1px solid ' + getSafetyColor(r.weekMaxLevel) + '55',
                  }"
                >
                  {{ getSafetyLabel(r.weekMaxLevel) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="rounded-lg border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-5">
      <div class="mb-2 text-sm font-semibold text-sky-400">结论与建议</div>
      <p class="text-sm leading-relaxed text-slate-300">{{ conclusion }}</p>
      <div class="mt-4 space-y-1.5 text-xs text-slate-400">
        <p>1. 监测数据频率：GNSS 与雷达系统每小时自动采集上报一次。</p>
        <p>2. 报警阈值：安全 < 2mm/天，预警 2~5mm/天，警示 5~10mm/天，报警 > 10mm/天。</p>
        <p>3. 报告周期：按自然周（周一 00:00 ~ 周日 23:59:59）统计。</p>
        <p>4. 报告生成：每周一 08:00 自动生成上一周监测报告，可在系统中打印或导出 PDF。</p>
      </div>
      <div class="mt-5 text-right text-[11px] text-slate-500">
        报告生成时间：{{ new Date().toLocaleString() }}
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  body {
    background: #fff !important;
  }
  .print\\:hidden {
    display: none !important;
  }
}
</style>
