<template>
  <div class="login-panel">
    <div class="title drag">Uchat</div>
    <div class="login-form">
      <div class="error_msg"></div>
      <el-form :model="formData" :rules="rules" ref="formDataRef" label-width="0px" @submit.prevent>
        <!--input输入-->
        <el-form-item prop="username">
          <el-input size="large" clearable placeholder="请输入用户名" v-model="username" required>
            《<template #prefix>
              <span class="iconfont icon-email"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            size="large"
            show-password
            clearable
            placeholder="请输入密码"
            v-model="password"
            required
          >
            《<template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-button type="primary" class="login-btn" @click="testr">{{
            isLogin ? '登录' : '注册'
          }}</el-button>
        </el-form-item>
        <div class="botton-link">
          <span class="a-link" @click="changeOpType">{{ isLogin ? '注册' : '返回登录' }}</span>
        </div>
      </el-form>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import SettingsDialog from '../components/SettingsDialog.vue'
import { register, login, sendMessage, logout, electronAlert } from '../ipcApi'
import { LoginRequest, RegisterRequest } from '@apiType/HttpRequest'
import { ClientMessage } from '@apiType/WebsocketRequest'
import { ElMessage } from 'element-plus'
import '../assets/iconfont/iconfont.css'
import '../assets/base.scss'
import router from '@renderer/router'

const username = ref('')
const password = ref('')
const isLogin = ref(true)
const changeOpType = () => {
  isLogin.value = !isLogin.value
}
const testr = async () => {
  if (isLogin.value) {
    try {
      const loginData: LoginRequest = {
        userid: Number(username.value), // ⚠️ 确保转换为 number
        password: password.value
      }
      const success = await login(loginData)
      if (success) {
        ElMessage('登录成功');
        router.push('/chat')
      } else {
        ElMessage('登录失败')
      }
    } catch (err) {
      console.error('登录失败:', err)
    }
  } else {
    try {
      const request: RegisterRequest = {
        username: username.value,
        password: password.value
      }
      const result = await register(request)
      if (result.action == 'register_response') {
        ElMessage(result.message)
      }
    } catch (err) {
      console.error('注册失败:', err)
      ElMessage('注册失败')
    }
  }
}
</script>

<style lang="scss" scoped>
.email-select {
  width: 250px;
}
.loading-panel {
  height: calc(100vh - 32px);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  img {
    white-space: 300px;
  }
}
.login-panel {
  background-color: #fff;
  border-radius: 3px;
  border: 1px solid #ddd;
  .title {
    height: 30px;
    padding: 5px 0px 0px 10px;
  }

  .login-form {
    padding: 0px 15px 29px 15px;
    :deep(.el-input__wrapper) {
      box-shadow: none;
      border-radius: none;
    }
    .el-form-item {
      border-bottom: 1px solid #ddd;
    }

    .email-panel {
      align-items: center;
      width: 100%;
      display: flex;
      .input {
        flex: 1;
      }
      .icon-down {
        margin-left: 3px;
        width: 16px;
        cursor: pointer;
        border: none;
      }
    }
    .error-msg {
      line-height: 30px;
      height: 30px;
      color: #fb7373;
    }
    .check-code-panel {
      display: flex;
      .check-code {
        cursor: pointer;
        width: 120px;
        margin-left: 5px;
      }
    }
    .login-btn {
      margin-top: 20px;
      width: 100%;
      background: #0066ff;
      height: 36px;
      font-size: 16px;
    }
    .botton-link {
      text-align: right;
    }
  }
}
</style>
