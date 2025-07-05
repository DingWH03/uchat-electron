<template>
  <div class="notification-settings">
    <h3>通知设置</h3>
    <div class="setting-item">
      <label class="setting-label">
        <input 
          type="checkbox" 
          v-model="isEnabled" 
          @change="toggleNotification"
        />
        <span class="setting-text">启用桌面通知</span>
      </label>
      <p class="setting-description">
        当收到新消息时显示桌面通知
      </p>
    </div>
    
    <div class="setting-item" v-if="isEnabled">
      <label class="setting-label">
        <input 
          type="checkbox" 
          v-model="showOwnMessages" 
          @change="toggleOwnMessageNotification"
        />
        <span class="setting-text">显示自己发送的消息通知</span>
      </label>
      <p class="setting-description">
        默认情况下不会显示自己发送的消息通知
      </p>
    </div>
    
    <div class="setting-item">
      <label class="setting-label">
        <input 
          type="checkbox" 
          v-model="showSystemNotifications" 
          @change="toggleSystemNotification"
        />
        <span class="setting-text">显示系统通知</span>
      </label>
      <p class="setting-description">
        显示连接状态、错误等系统通知
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { notificationManager } from '../utils/notification'

const isEnabled = ref(true)
const showOwnMessages = ref(false)
const showSystemNotifications = ref(true)

onMounted(() => {
  // 从本地存储加载设置
  loadSettings()
})

function loadSettings(): void {
  const settings = localStorage.getItem('notificationSettings')
  if (settings) {
    const parsed = JSON.parse(settings)
    isEnabled.value = parsed.isEnabled ?? true
    showOwnMessages.value = parsed.showOwnMessages ?? false
    showSystemNotifications.value = parsed.showSystemNotifications ?? true
  }
  
  // 应用设置到通知管理器
  applySettings()
}

function saveSettings(): void {
  const settings = {
    isEnabled: isEnabled.value,
    showOwnMessages: showOwnMessages.value,
    showSystemNotifications: showSystemNotifications.value
  }
  localStorage.setItem('notificationSettings', JSON.stringify(settings))
}

function applySettings(): void {
  notificationManager.setEnabled(isEnabled.value)
  notificationManager.setShowOwnMessages(showOwnMessages.value)
  notificationManager.setShowSystemNotifications(showSystemNotifications.value)
}

function toggleNotification(): void {
  applySettings()
  saveSettings()
}

function toggleOwnMessageNotification(): void {
  applySettings()
  saveSettings()
}

function toggleSystemNotification(): void {
  applySettings()
  saveSettings()
}
</script>

<style scoped>
.notification-settings {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-settings h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.setting-label input[type="checkbox"] {
  margin-right: 10px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.setting-text {
  flex: 1;
}

.setting-description {
  margin: 5px 0 0 28px;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}
</style> 