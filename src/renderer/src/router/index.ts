import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import About from '../page/About.vue'
import Login from '../page/Login.vue'
import Chat from '@renderer/page/Chat.vue'
import Search from '@renderer/page/Search.vue'
import Create from '@renderer/page/Create.vue'
import Settings from '../page/Settings.vue'
import Contact from '../page/Contact.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: Login, meta: { layout: 'full' } },
  { path: '/about', name: 'About', component: About },
  { path: '/login', name: 'Login', component: Login, meta: { layout: 'full' } },
  { path: '/chat', name: 'Chat', component: Chat },
  { path: '/chat/friend/:id', name: 'ChatFriend', component: Chat },
  { path: '/chat/group/:id', name: 'ChatGroup', component: Chat },
  { path: '/search', name: 'Search', component: Search },
  { path: '/create', name: 'Create', component: Create },
  { path: '/settings', name: 'Settings', component: Settings },
  { path: '/contact', name: 'Contact', component: Contact }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
