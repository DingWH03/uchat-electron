<template>
  <div class="dialog-backdrop" @click.self="close">
    <div class="dialog-box">
      <h3>设置服务器地址</h3>
      <input v-model="url" placeholder="http://localhost:3000" />
      <button @click="save">保存</button>
      <button @click="close">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const props = defineProps<{ }>()
const emit = defineEmits(['close'])

const url = ref(localStorage.getItem('server_url') || '')

const save = () => {
  localStorage.setItem('server_url', url.value)
  alert(`已保存: ${url.value}`)
  emit('close')
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
}
.dialog-box {
  background: white;
  padding: 20px;
  border-radius: 6px;
  width: 300px;
}
input {
  width: 100%;
  margin: 10px 0;
  padding: 6px;
}
button {
  margin-right: 10px;
}
</style>
