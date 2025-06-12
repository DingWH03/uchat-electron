<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('[App.vue] 注册 WebSocket 监听')

  window.api.onWSStatus((status) => {
    console.log('[UI] WebSocket 状态变化:', status)
  })

  window.api.onWSMessage((msg) => {
    alert(`[WebSocket] 收到消息: ${JSON.stringify(msg)}`)
  })
})
</script>

<template>
  <router-view />
</template>
