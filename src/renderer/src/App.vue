<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import MainContent from './components/MainContent.vue'
import { showNotification } from './utils/notification'

const route = useRoute()
const router = useRouter()
const wsStatus = ref<
  'connected' | 'disconnected' | 'reconnecting' | 'network-error' | 'session-invalid' | ''
>('')

onMounted(() => {
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.on('ws:status', (_event, status) => {
      wsStatus.value = status
      if (status === 'network-error') {
        showNotification('网络异常', '请检查网络连接')
      } else if (status === 'session-invalid') {
        showNotification('登录失效', '请重新登录')
        router.push({ name: 'Login' })
      } else if (status === 'disconnected') {
        showNotification('连接断开', '正在尝试重连...')
      } else if (status === 'reconnecting') {
        showNotification('正在重连', '正在尝试重新连接服务器...')
      } else if (status === 'connected') {
        showNotification('已连接', 'WebSocket 连接已恢复')
      }
    })
  }
})

function manualReconnect(): void {
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.invoke('ws:manual-reconnect')
  }
}
</script>

<template>
  <div>
    <div v-if="wsStatus && wsStatus !== 'connected'" class="ws-banner">
      <span v-if="wsStatus === 'network-error'">网络异常，无法连接服务器。</span>
      <span v-else-if="wsStatus === 'session-invalid'">登录已失效，请重新登录。</span>
      <span v-else-if="wsStatus === 'disconnected'">连接已断开，您可以尝试</span>
      <span v-else-if="wsStatus === 'reconnecting'">正在重连服务器...</span>
      <button
        v-if="wsStatus === 'network-error' || wsStatus === 'disconnected'"
        @click="manualReconnect"
      >
        重试连接
      </button>
    </div>
    <div v-if="route.meta.layout === 'full'">
      <router-view />
    </div>
    <div v-else class="app-layout">
      <Sidebar />
      <MainContent />
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}
.ws-banner {
  width: 100vw;
  background: #ffeaea;
  color: #d32f2f;
  text-align: center;
  padding: 8px 0;
  font-size: 15px;
  z-index: 1000;
}
.ws-banner button {
  margin-left: 12px;
  background: #d32f2f;
  color: #fff;
  border: none;
  border-radius: 3px;
  padding: 2px 10px;
  cursor: pointer;
}
</style>
