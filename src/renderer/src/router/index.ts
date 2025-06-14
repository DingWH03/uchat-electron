import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import About from '../page/About.vue'
import Login from '../page/Login.vue'
import Chat from '@renderer/page/Chat.vue'
import Search from '@renderer/page/Search.vue'
import Create from '@renderer/page/Create.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: Login },
  { path: '/about', name: 'About', component: About },
  { path: '/login', name: 'Login', component: Login },
  { path: '/chat', name: 'Chat', component: Chat },
  { path: '/search', name: 'Search', component: Search },
  { path: '/create', name: 'Create', component: Create }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
