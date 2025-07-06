<template>
  <div class="settings-page-full">
    <div class="settings-content">
      <h2 class="settings-title">设置</h2>
      <section class="settings-section">
        <h3 class="section-title">账户设置</h3>
        <AppButton type="danger" icon="logout" class="logout-btn" @click="back">
          退出登录
        </AppButton>
      </section>
      <section class="settings-section">
        <h3 class="section-title">界面设置</h3>
        <div class="setting-row">
          <span>主题模式</span>
          <select v-model="theme" class="theme-select">
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '../ipcApi'
import AppButton from '../components/AppButton.vue'

const router = useRouter()
const theme = ref(localStorage.getItem('theme') || 'light')

const back = (): void => {
  router.push('/login')
  logout()
}

watch(theme, (val) => {
  localStorage.setItem('theme', val)
  document.documentElement.setAttribute('data-theme', val)
})
</script>

<style scoped>
.settings-page-full {
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
}
.settings-content {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 32px 24px 32px;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.settings-title {
  font-size: 1.7rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: left;
}
.settings-section {
  margin-bottom: 0.5rem;
}
.section-title {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 0.7rem;
  color: #409eff;
}
.setting-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
.theme-select {
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  background: #f8f8f8;
  font-size: 1rem;
}
.logout-btn {
  margin-top: 0.5rem;
  width: 100%;
}
</style>
