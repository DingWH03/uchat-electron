<template>
  <div class="login-panel">
    <div class="title drag">Uchat</div>
    <div class="login-form">
      <div class="error_msg"></div>
      <el-form ref="formDataRef" label-width="0px" @submit.prevent @keydown.enter="testr">
        <!--input输入-->
        <el-form-item prop="username">
          <el-input v-model="username" size="large" clearable placeholder="请输入用户名" required>
            《<template #prefix>
              <span class="iconfont icon-email"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="password"
            size="large"
            show-password
            clearable
            placeholder="请输入密码"
            required
          >
            《<template #prefix>
              <span class="iconfont icon-password"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="isLogin">
          <el-checkbox v-model="rememberMe" @change="catchaccount">记住账号密码</el-checkbox>
        </el-form-item>
        <el-form-item prop="password">
          <el-button type="primary" class="login-btn" @click="testr">{{
            isLogin ? '登录' : '注册'
          }}</el-button>
        </el-form-item>
        <div class="botton-link">
          <span class="a-link" @click="changeOpType">{{ isLogin ? '注册' : '返回登录' }}</span>
          <span class="a-link" @click="showSettings = true" style="margin-left: 16px;">设置服务器</span>
        </div>
      </el-form>
    </div>
    <SettingsDialog v-if="showSettings" @close="showSettings = false" :show-logout="false" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { register, login } from '../ipcApi'
import { LoginRequest, RegisterRequest } from '@apiType/HttpRequest'
import { ElMessage } from 'element-plus'
import '../assets/iconfont/iconfont.css'
import '../assets/base.scss'
import router from '@renderer/router'
import { Account } from '@/types/localDBModel'
import { addOrUpdateAccount, getAccounts } from '@renderer/ipcDB'
import SettingsDialog from '../components/SettingsDialog.vue'

const username = ref('')
const password = ref('')
const isLogin = ref(true)

const rememberMe = ref(false)

const showSettings = ref(false)

const changeOpType = (): void => {
  isLogin.value = !isLogin.value
}
const testr = async (): Promise<void> => {
  if (isLogin.value) {
    try {
      const loginData: LoginRequest = {
        userid: Number(username.value), // ⚠️ 确保转换为 number
        password: password.value
      }
      const success = await login(loginData)
      const inputAccount: Account = {
        id: Number(username.value),
        username: '',
        password: password.value
      }
      if (success) {
        ElMessage('登录成功')
        if (rememberMe.value) {
          const result = addOrUpdateAccount(inputAccount)
          if ((await result).success == true) {
            console.log('成功插入登陆账号至本地数据库')
          } else if ((await result).success == false) {
            console.log('未成功插入登陆账号至本地数据库')
          }
        }
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
      if (result.status == true) {
        ElMessage(String(result.data))
      }
    } catch (err) {
      console.error('注册失败:', err)
      ElMessage('注册失败')
    }
  }
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const catchaccount = async () => {
  if (!rememberMe.value) return
  try {
    const result = await getAccounts()
    if (result.success) {
      // 成功的情况，result 被推断为 SuccessResult<Account[]>
      const accounts = result.data // 可以安全地访问 data
      console.log('获取到的账户:', accounts[0])
      if (isLogin.value) {
        username.value = accounts[0].id.toString()
        password.value = accounts[0].password
      }
    } else {
      // 失败的情况，result 被推断为 ErrorResult
      console.error('获取账户失败:', result.error)
    }
  } catch (error) {
    console.error('发生未预期的错误:', error)
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
