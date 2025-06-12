<template>
  <div class="login-container">
    <!-- 设置按钮 -->
    <div class="settings-btn">
      <button @click="openSettings">⚙️</button>
    </div>

    <h1>登录</h1>

    <form @submit.prevent="handleLogin">
      <input v-model="username" placeholder="用户名" required />
      <input v-model="password" type="password" placeholder="密码" required />
      <button type="submit">登录</button>
    </form>

    <button class="register-btn" @click="handleRegister">注册新账号</button>

    <!-- 设置弹窗 -->
    <SettingsDialog v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SettingsDialog from '../components/SettingsDialog.vue'
import { register, login, sendMessage, logout } from '../ipcApi'
import { LoginRequest } from 'src/types/HttpRequest'
import { ClientMessage } from 'src/types/WebsocketRequest'

const username = ref('')
const password = ref('')
const showSettings = ref(false)

const openSettings = () => {
  showSettings.value = true
}

const handleLogin = async () => {
  try {
    const loginData: LoginRequest = {
      userid: Number(username.value),  // ⚠️ 确保转换为 number
      password: password.value
    }
    const success = await login(loginData)
    if (success) {
      alert('登录成功')
      const message: ClientMessage = {
        type: 'SendMessage',
        receiver: 6,
        message: 'Hellooooooooo'
      }
      sendMessage(message)
    } else {
      alert('登录失败')
    }
  } catch (err) {
    console.error('登录失败:', err)
    alert('登录失败')
  }
  logout()
}

const handleRegister = async () => {
  try {
    await register({ username: username.value, password: password.value })
    alert('注册成功')
  } catch (err) {
    console.error('注册失败:', err)
    alert('注册失败')
  }
}
</script>

<style scoped>
.login-container {
  width: 300px;
  margin: 80px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  position: relative;
  text-align: center;
}
input {
  display: block;
  width: 100%;
  padding: 8px;
  margin: 10px 0;
}
button {
  padding: 8px 16px;
  margin-top: 10px;
}
.settings-btn {
  position: absolute;
  top: 10px;
  right: 10px;
}
.register-btn {
  background-color: #eee;
  border: none;
}
</style>
