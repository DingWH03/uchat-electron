<template>
  <div class="dialog-backdrop" @click.self="close">
    <div class="dialog-box">
      <h3>设置</h3>
      <el-divider>服务器</el-divider>
      <el-form label-position="top" class="settings-form">
        <el-form-item label="服务器地址">
          <el-input v-model="url" placeholder="http://localhost:3000" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="save">保存</el-button>
          <el-button @click="close">取消</el-button>
        </el-form-item>
      </el-form>
      <el-divider v-if="props.showLogout">账户</el-divider>
      <div class="logout-row" v-if="props.showLogout">
        <el-button type="danger" @click="logout" plain>退出登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const props = defineProps({
  showLogout: { type: Boolean, default: true }
})
const emit = defineEmits(['close'])
const router = useRouter()

const url = ref(localStorage.getItem('server_url') || '')

const save = () => {
  localStorage.setItem('server_url', url.value)
  ElMessage.success(`已保存: ${url.value}`)
  emit('close')
}

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
.settings-form {
  margin-bottom: 12px;
}
.logout-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
