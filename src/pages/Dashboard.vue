<script setup lang="ts">
import { ref } from 'vue'
import { Activity, AlertTriangle, Shield, ShieldAlert, AlertCircle, MapPin } from 'lucide-vue-next'
import StatCard from '@/components/StatCard.vue'
import Slope3DView from '@/components/Slope3DView.vue'
import MonitorTable from '@/components/MonitorTable.vue'
import PointDetailModal from '@/components/PointDetailModal.vue'
import { useMockData } from '@/composables/useMockData'
import { SAFETY_THRESHOLDS, getSafetyColor } from '@/composables/useSafetyLevel'
import type { MonitorPoint } from '@/types'

const { points, levelCounts, latestUpdate } = useMockData()

const selectedPoint = ref<MonitorPoint | null>(null)
const detailVisible = ref(false)

function openDetail(point: MonitorPoint) {
  selectedPoint.value = point
  detailVisible.value = true
}

function closeDetail() {
  detailVisible.value = false
}
</script>

<template>
  <div class="grid flex-1 grid-cols-12 gap-4 overflow-hidden p-4">
    <aside class="col-span-12 flex flex-col gap-4 lg:col-span-3">
      <div class="grid grid-cols-2 gap-3">
        <StatCard
          title="监测点总数"
          :value="points.length"
          color="#38bdf8"
          :icon="MapPin"
          subtitle="含采场与排土场"
        />
        <StatCard
          title="最新数据时间"
          :value="new Date(latestUpdate).toLocaleTimeString()"
          color="#a78bfa"
          :icon="Activity"
          :subtitle="new Date(latestUpdate).toLocaleDateString()"
        />
        <StatCard
          title="安全 ( < 2mm/天 )"
          :value="levelCounts.safe"
          :color="getSafetyColor('safe')"
          :icon="Shield"
        />
        <StatCard
          title="预警 ( 2-5mm/天 )"
          :value="levelCounts.warn"
          :color="getSafetyColor('warn')"
          :icon="AlertCircle"
        />
        <StatCard
          title="警示 ( 5-10mm/天 )"
          :value="levelCounts.alert"
          :color="getSafetyColor('alert')"
          :icon="ShieldAlert"
        />
        <StatCard
          title="报警 ( > 10mm/天 )"
          :value="levelCounts.danger"
          :color="getSafetyColor('danger')"
          :icon="AlertTriangle"
        />
      </div>

      <div class="rounded-lg border border-slate-700/60 bg-slate-900/80 p-4">
        <div class="mb-3 text-sm font-semibold text-sky-400">安全等级图例</div>
        <div class="space-y-2">
          <div
            v-for="t in SAFETY_THRESHOLDS"
            :key="t.level"
            class="flex items-center justify-between rounded border border-slate-800 bg-slate-950/40 px-3 py-2"
          >
            <div class="flex items-center gap-2">
              <span
                class="inline-block h-3 w-3 rounded-full"
                :style="{ background: t.color, boxShadow: `0 0 8px ${t.color}` }"
              />
              <span class="text-sm text-slate-300">{{ t.label }}</span>
            </div>
            <span class="text-xs font-mono text-slate-500">
              {{ t.min }} - {{ t.max === Infinity ? '∞' : t.max }} mm/天
            </span>
          </div>
        </div>
      </div>
    </aside>

    <section class="col-span-12 flex flex-col gap-4 lg:col-span-6">
      <div class="relative flex-1 overflow-hidden rounded-lg border border-slate-700/60 bg-slate-900/60">
        <div class="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
          <div class="text-sm font-semibold text-sky-400">边坡 3D 示意图</div>
          <div class="text-[11px] text-slate-500">点击监测点查看近 30 天趋势</div>
        </div>
        <div class="h-[calc(100%-48px)] min-h-[500px] w-full">
          <Slope3DView :points="points" @point-click="openDetail" />
        </div>
      </div>
    </section>

    <aside class="col-span-12 flex flex-col lg:col-span-3">
      <div class="flex-1 min-h-[500px]">
        <MonitorTable :points="points" @point-click="openDetail" />
      </div>
    </aside>

    <PointDetailModal
      :point="selectedPoint"
      :visible="detailVisible"
      @close="closeDetail"
    />
  </div>
</template>
