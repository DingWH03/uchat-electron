<template>
  <div class="login-panel">
    <div class="title drag">Uchat</div>
    <div class="login-form">
      <div class="error_msg"></div>
      <el-form :model="formData" :rules="rules" ref="formDataRef" label-width="0px" @submit.prevent>
        <!--input输入-->
        <el-form-item prop="username">
          <el-input 
            size="large" 
            clearable 
            placeholder="请输入用户名" 
            v-model="username" 
            required
            @focus="autoFillPassword"
          >
            <template #prefix>
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
            <template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
        </el-form-item>
        <el-form-item prop="password">
          <el-button type="primary" class="login-btn" @click="testr">
            {{ isLogin ? '登录' : '注册' }}
          </el-button>
        </el-form-item>
        <div class="botton-link">
          <span class="a-link" @click="changeOpType">{{ isLogin ? '注册' : '返回登录' }}</span>
          <span v-if="hasSavedCredentials" class="a-link clear-link" @click="clearCredentials">
            清除保存的密码
          </span>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import router from '@renderer/router'

const username = ref('')
const password = ref('')
const isLogin = ref(true)
const rememberMe = ref(true)

// 检查是否有保存的凭证
const hasSavedCredentials = computed(() => {
  return localStorage.getItem('lastLoginUsername') !== null
})

// 组件加载时自动填充用户名
onMounted(() => {
  const lastUser = localStorage.getItem('lastLoginUsername')
  if (lastUser) {
    username.value = lastUser
  }
})

// 用户名获得焦点时自动填充密码
const autoFillPassword = () => {
  if (!password.value && hasSavedCredentials.value && username.value === localStorage.getItem('lastLoginUsername')) {
    const savedPassword = localStorage.getItem('loginPassword')
    if (savedPassword) {
      password.value = savedPassword
    }
  }
}

// 清除保存的凭证
const clearCredentials = () => {
  localStorage.removeItem('lastLoginUsername')
  localStorage.removeItem('loginPassword')
  password.value = ''
  ElMessage.success('已清除保存的密码')
}

const changeOpType = () => {
  isLogin.value = !isLogin.value
}

const testr = async () => {
  if (isLogin.value) {
    try {
      // 模拟登录API调用
      const loginSuccess = true // 替换为实际登录逻辑
      
      if (loginSuccess) {
        if (rememberMe.value) {
          // 保存凭证
          localStorage.setItem('lastLoginUsername', username.value)
          localStorage.setItem('loginPassword', password.value)
        } else {
          // 不记住密码时清除保存的凭证
          localStorage.removeItem('loginPassword')
        }
        
        ElMessage.success('登录成功')
        router.push('/chat')
      } else {
        ElMessage.error('登录失败')
      }
    } catch (err) {
      console.error('登录失败:', err)
      ElMessage.error('登录失败')
    }
  } else {
    try {
      // 模拟注册API调用
      const registerSuccess = true // 替换为实际注册逻辑
      
      if (registerSuccess) {
        ElMessage.success('注册成功')
        isLogin.value = true // 注册成功后切换到登录界面
      }
    } catch (err) {
      console.error('注册失败:', err)
      ElMessage.error('注册失败')
    }
  }
}
</script>

<style lang="scss" scoped>
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
      &:last-child {
        border-bottom: none;
      }
    }

    .el-checkbox {
      margin-left: 8px;
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
      display: flex;
      justify-content: space-between;
      .clear-link {
        color: #f56c6c;
      }
    }
  }
}
</style>