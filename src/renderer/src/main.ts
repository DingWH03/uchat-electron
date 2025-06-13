import './assets/cust-elementplus.scss'
import './assets/base.scss'
import './assets/iconfont.css'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).use(ElementPlus).mount('#app')
