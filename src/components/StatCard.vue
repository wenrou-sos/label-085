<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  color?: string
  icon?: any
  subtitle?: string
}>()
</script>

<template>
  <div class="group relative overflow-hidden rounded-lg border border-slate-700/60 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 backdrop-blur transition hover:border-slate-600 hover:shadow-[0_0_20px_rgba(56,189,248,0.1)]">
    <div
      class="absolute inset-x-0 top-0 h-[2px] opacity-60"
      :style="{ background: color ?? '#38bdf8' }"
    />
    <div class="flex items-start justify-between">
      <div>
        <div class="text-xs font-medium tracking-wider text-slate-400">{{ title }}</div>
        <div
          class="mt-1 text-2xl font-bold"
          :style="{ color: color ?? '#e2e8f0' }"
        >
          {{ value }}
        </div>
        <div v-if="subtitle" class="mt-1 text-[11px] text-slate-500">{{ subtitle }}</div>
      </div>
      <component
        v-if="icon"
        :is="icon"
        class="h-7 w-7 opacity-70 transition group-hover:opacity-100"
        :style="{ color: color ?? '#64748b' }"
      />
    </div>
  </div>
</template>
