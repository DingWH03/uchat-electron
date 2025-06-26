<template>
  <div class="dialog-backdrop" @click.self="close">
    <div class="dialog-box">
      <h3>服务器设置</h3>
      <el-divider>服务器地址</el-divider>
      <el-form label-position="top" class="settings-form">
        <el-form-item label="服务器地址">
          <el-input v-model="url" placeholder="http://localhost:3000" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="save">保存</el-button>
          <el-button @click="close">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getBaseUrl, setBaseUrl } from '../ipcApi'

const emit = defineEmits(['close'])

const url = ref('')

onMounted(async () => {
  try {
    url.value = await getBaseUrl()
  } catch (error) {
    console.error('获取服务器地址失败:', error)
    url.value = ''
  }
})

const save = async () => {
  try {
    const success = await setBaseUrl(url.value)
    if (success) {
      ElMessage.success(`已保存: ${url.value}`)
      emit('close')
    } else {
      ElMessage.error('保存失败')
    }
  } catch (error) {
    console.error('保存服务器地址失败:', error)
    ElMessage.error('保存失败')
  }
}

const close = () => {
  emit('close')
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
</style> 