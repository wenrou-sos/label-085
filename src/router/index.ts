import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/pages/Dashboard.vue'
import Report from '@/pages/Report.vue'

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/report', name: 'report', component: Report },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
