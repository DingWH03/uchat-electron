import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import About from '../page/About.vue'
import Login from '../page/Login.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: Login },
  { path: '/about', name: 'About', component: About },
  { path: '/login', name: 'Login', component: Login }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
