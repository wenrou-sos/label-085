<script setup lang="ts">
import TopBar from '@/components/TopBar.vue'
</script>

<template>
  <div class="flex h-screen min-h-screen w-full flex-col bg-[#0B1220] text-slate-200">
    <TopBar />
    <router-view />
  </div>
</template>
