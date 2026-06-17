<script setup lang="ts">
import { computed, ref } from 'vue'
import { Cpu, Radar, Satellite } from 'lucide-vue-next'
import type { MonitorPoint, MonitorType, SafetyLevel, SlopeArea } from '@/types'
import { getSafetyColor, getSafetyLabel } from '@/composables/useSafetyLevel'

const props = defineProps<{
  points: MonitorPoint[]
}>()

const emit = defineEmits<{
  (e: 'point-click', point: MonitorPoint): void
}>()

const typeFilter = ref<MonitorType | 'ALL'>('ALL')
const areaFilter = ref<SlopeArea | 'ALL'>('ALL')
const levelFilter = ref<SafetyLevel | 'ALL'>('ALL')

const filtered = computed(() =>
  props.points.filter((p) => {
    if (typeFilter.value !== 'ALL' && p.type !== typeFilter.value) return false
    if (areaFilter.value !== 'ALL' && p.area !== areaFilter.value) return false
    if (levelFilter.value !== 'ALL' && p.level !== levelFilter.value) return false
    return true
  }),
)
</script>

<template>
  <div class="flex h-full flex-col rounded-lg border border-slate-700/60 bg-slate-900/80 backdrop-blur">
    <div class="flex items-center justify-between border-b border-slate-700/60 px-4 py-3">
      <div class="text-sm font-semibold text-sky-400">监测点列表</div>
      <div class="flex items-center gap-1.5">
        <select
        v-model="areaFilter"
        class="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
      >
        <option value="ALL">全部区域</option>
        <option value="stope">采场</option>
        <option value="dump">排土场</option>
      </select>
      <select
        v-model="typeFilter"
        class="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
      >
        <option value="ALL">全部类型</option>
        <option value="GNSS">GNSS</option>
        <option value="Radar">雷达</option>
      </select>
      <select
        v-model="levelFilter"
        class="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-sky-500 focus:outline-none"
      >
        <option value="ALL">全部等级</option>
        <option value="safe">安全</option>
        <option value="warn">预警</option>
        <option value="alert">警示</option>
        <option value="danger">报警</option>
      </select>
      </div>
    </div>
    <div class="flex-1 overflow-auto">
      <table class="w-full text-xs">
        <thead class="sticky top-0 z-10 bg-slate-900 text-slate-400">
          <tr class="border-b border-slate-700/60">
            <th class="px-3 py-2 text-left font-medium">名称</th>
            <th class="px-3 py-2 text-left font-medium">类型</th>
            <th class="px-3 py-2 text-left font-medium">区域</th>
            <th class="px-3 py-2 text-right font-medium">水平(mm)</th>
            <th class="px-3 py-2 text-right font-medium">垂直(mm)</th>
            <th class="px-3 py-2 text-right font-medium">速率(mm/天)</th>
            <th class="px-3 py-2 text-center font-medium">等级</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in filtered"
            :key="p.id"
            class="cursor-pointer border-b border-slate-800 text-slate-300 transition hover:bg-slate-800/60"
            @click="emit('point-click', p)"
          >
            <td class="px-3 py-2 font-medium text-slate-200">{{ p.name }}</td>
            <td class="px-3 py-2">
              <span class="inline-flex items-center gap-1">
                <component :is="p.type === 'GNSS' ? Satellite : Radar" class="h-3 w-3 text-slate-400" />
                {{ p.type }}
              </span>
            </td>
            <td class="px-3 py-2 text-slate-400">
              {{ p.area === 'stope' ? '采场' : '排土场' }}
            </td>
            <td class="px-3 py-2 text-right font-mono">{{ p.horizontalDisplacement.toFixed(2) }}</td>
            <td class="px-3 py-2 text-right font-mono">{{ p.verticalDisplacement.toFixed(2) }}</td>
            <td class="px-3 py-2 text-right font-mono font-bold" :style="{ color: getSafetyColor(p.level) }">
              {{ p.displacementRate.toFixed(2) }}
            </td>
            <td class="px-3 py-2 text-center">
              <span
                class="inline-block rounded px-2 py-0.5 text-[10px font-semibold"
                :style="{ background: getSafetyColor(p.level) + '22', color: getSafetyColor(p.level), border: '1px solid ' + getSafetyColor(p.level) + '55' }"
              >
                {{ getSafetyLabel(p.level) }}
              </span>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="7" class="px-3 py-8 text-center text-slate-500">
              <Cpu class="mx-auto mb-1 h-5 w-5 opacity-50" />
              <div>无匹配监测点</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="border-t border-slate-700/60 px-4 py-2 text-[11px] text-slate-500">
        共 {{ filtered.length }} / {{ points.length }} 个监测点
      </div>
  </div>
</template>
