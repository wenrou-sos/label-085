<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Mountain, FileText, Clock, ArrowLeftRight } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const now = ref(new Date())
let timer: number | null = null

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b border-slate-700/60 bg-slate-900/80 px-6 backdrop-blur">
    <div class="flex items-center gap-3">
      <div class="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-blue-600">
        <Mountain class="h-5 w-5 text-white" />
      </div>
      <div>
        <div class="text-base font-bold tracking-wide text-slate-100">
          露天矿边坡安全监测面板
        </div>
        <div class="text-[11px] text-slate-400">Open-Pit Slope Safety Monitoring System</div>
      </div>
    </div>

    <div class="flex items-center gap-5">
      <div class="hidden items-center gap-2 rounded-md border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 md:flex">
        <Clock class="h-3.5 w-3.5 text-sky-400" />
        <span class="font-mono">{{ now.toLocaleString() }}</span>
      </div>
      <nav class="flex items-center gap-1">
        <button
          class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition"
          :class="route.path === '/' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'"
          @click="router.push('/')"
        >
          <ArrowLeftRight class="h-4 w-4" />
          监测总览
        </button>
        <button
          class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition"
          :class="route.path === '/report' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'"
          @click="router.push('/report')"
        >
          <FileText class="h-4 w-4" />
          周监测报告
        </button>
      </nav>
    </div>
  </header>
</template>
