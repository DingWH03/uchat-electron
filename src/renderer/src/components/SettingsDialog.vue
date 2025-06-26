<template>
  <div class="dialog-backdrop" @click.self="close">
    <div class="dialog-box">
      <h3>设置</h3>
      <el-divider>账户</el-divider>
      <div class="logout-row">
        <el-button type="danger" @click="logout" plain>退出登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['close'])
const router = useRouter()

const close = () => {
  emit('close')
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  ElMessage.success('已退出登录')
  emit('close')
  router.push('/login')
}
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}
.dialog-box {
  background: white;
  padding: 24px 24px 12px 24px;
  border-radius: 8px;
  width: 340px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
}
.logout-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
