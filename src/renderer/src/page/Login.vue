<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <span class="logo-icon">💬</span>
          <h1 class="app-title">Uchat</h1>
        </div>
        <p class="app-subtitle">欢迎使用聊天应用</p>
      </div>
      
      <div class="login-form">
        <el-form ref="formDataRef" label-width="0px" @submit.prevent @keydown.enter="handleSubmit">
          <!-- 用户名输入（集成账户选择） -->
          <el-form-item prop="username">
            <div class="username-input-wrapper">
              <el-input 
                v-model="username" 
                placeholder="请输入用户ID" 
                class="username-input"
                @input="onUsernameInput"
                @focus="onUsernameFocus"
                @blur="onUsernameBlur"
              >
                <template #prefix>
                  <span class="iconfont icon-email"></span>
                </template>
              </el-input>
              <el-dropdown 
                v-if="savedAccounts.length > 0"
                @command="onAccountSelect"
                trigger="click"
                class="account-dropdown"
              >
                <el-button class="dropdown-btn" type="text">
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item 
                      v-for="account in savedAccounts" 
                      :key="account.id"
                      :command="account.id.toString()"
                    >
                      <div class="dropdown-account-item">
                        <span class="account-id">用户 {{ account.id }}</span>
                        <span class="account-saved-tag">已保存</span>
                      </div>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <!-- 自动补全下拉框 -->
            <div v-if="showAutocomplete && filteredAccounts.length > 0" class="autocomplete-dropdown">
              <div 
                v-for="account in filteredAccounts" 
                :key="account.id"
                class="autocomplete-item"
                @click="selectAutocomplete(account)"
              >
                <span class="autocomplete-id">用户 {{ account.id }}</span>
                <span class="autocomplete-saved">已保存</span>
              </div>
            </div>
          </el-form-item>
          
          <!-- 密码输入 -->
          <el-form-item prop="password">
            <el-input
              v-model="password"
              size="large"
              show-password
              clearable
              placeholder="请输入密码"
              required
              class="custom-input"
            >
              <template #prefix>
                <span class="iconfont icon-password"></span>
              </template>
            </el-input>
          </el-form-item>
          
          <!-- 记住密码选项 -->
          <el-form-item v-if="isLogin">
            <el-checkbox v-model="rememberMe" class="remember-checkbox">
              记住账号密码
            </el-checkbox>
          </el-form-item>
          
          <!-- 登录/注册按钮 -->
          <el-form-item>
            <el-button 
              type="primary" 
              class="submit-btn" 
              @click="handleSubmit"
              :loading="loading"
            >
              {{ isLogin ? '登录' : '注册' }}
            </el-button>
          </el-form-item>
          
          <!-- 底部链接 -->
          <div class="bottom-links">
            <span class="link-btn" @click="changeOpType">
              {{ isLogin ? '注册新账户' : '返回登录' }}
            </span>
            <span class="link-btn" @click="showServerSettings = true">
              服务器设置
            </span>
          </div>
        </el-form>
      </div>
    </div>
    
    <ServerSettingsDialog v-if="showServerSettings" @close="showServerSettings = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { register, login } from '../ipcApi'
import { LoginRequest, RegisterRequest } from '@apiType/HttpRequest'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import '../assets/iconfont/iconfont.css'
import '../assets/base.scss'
import router from '@renderer/router'
import { Account } from '@/types/localDBModel'
import { addOrUpdateAccount, getAccounts } from '@renderer/ipcDB'
import ServerSettingsDialog from '../components/ServerSettingsDialog.vue'

const username = ref('')
const password = ref('')
const isLogin = ref(true)
const rememberMe = ref(true) // 默认勾选
const loading = ref(false)
const showServerSettings = ref(false)
const savedAccounts = ref<Account[]>([])
const showAutocomplete = ref(false)

// 计算过滤后的账户列表
const filteredAccounts = computed(() => {
  if (!username.value) return savedAccounts.value
  return savedAccounts.value.filter(account => 
    account.id.toString().includes(username.value)
  )
})

// 页面加载时获取保存的账户
onMounted(async () => {
  await loadSavedAccounts()
})

// 加载保存的账户
const loadSavedAccounts = async (): Promise<void> => {
  try {
    const result = await getAccounts()
    if (result.success && result.data.length > 0) {
      savedAccounts.value = result.data
      // 如果有保存的账户，自动选择第一个
      if (savedAccounts.value.length > 0) {
        username.value = savedAccounts.value[0].id.toString()
        password.value = savedAccounts.value[0].password
      }
    }
  } catch (error) {
    console.error('加载保存的账户失败:', error)
  }
}

// 用户名输入处理
const onUsernameInput = (value: string): void => {
  // 检查是否是已保存的账户
  const account = savedAccounts.value.find(acc => acc.id.toString() === value)
  if (account) {
    // 如果是已保存的账户，自动填充密码
    password.value = account.password
    rememberMe.value = true
  } else {
    // 如果是新输入的用户名，清空密码
    password.value = ''
  }
}

// 输入框获得焦点
const onUsernameFocus = (): void => {
  if (savedAccounts.value.length > 0) {
    showAutocomplete.value = true
  }
}

// 输入框失去焦点
const onUsernameBlur = (): void => {
  // 延迟隐藏，让点击事件能够触发
  setTimeout(() => {
    showAutocomplete.value = false
  }, 200)
}

// 从下拉菜单选择账户
const onAccountSelect = (value: string): void => {
  const account = savedAccounts.value.find(acc => acc.id.toString() === value)
  if (account) {
    username.value = account.id.toString()
    password.value = account.password
    rememberMe.value = true
  }
}

// 选择自动补全项
const selectAutocomplete = (account: Account): void => {
  username.value = account.id.toString()
  password.value = account.password
  rememberMe.value = true
  showAutocomplete.value = false
}

// 切换登录/注册模式
const changeOpType = (): void => {
  isLogin.value = !isLogin.value
  username.value = ''
  password.value = ''
}

// 处理提交
const handleSubmit = async (): Promise<void> => {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  
  loading.value = true
  
  try {
    if (isLogin.value) {
      await handleLogin()
    } else {
      await handleRegister()
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    loading.value = false
  }
}

// 处理登录
const handleLogin = async (): Promise<void> => {
  try {
    const loginData: LoginRequest = {
      userid: Number(username.value),
      password: password.value
    }
    
    const success = await login(loginData)
    
    if (success) {
      ElMessage.success('登录成功')
      
      // 如果勾选了记住密码，保存账户信息
      if (rememberMe.value) {
        const inputAccount: Account = {
          id: Number(username.value),
          username: username.value,
          password: password.value
        }
        
        const result = await addOrUpdateAccount(inputAccount)
        if (result.success) {
          console.log('成功保存账户信息')
          await loadSavedAccounts() // 重新加载账户列表
        } else {
          console.log('保存账户信息失败')
        }
      }
      
      router.push('/chat')
    } else {
      ElMessage.error('登录失败，请检查用户名和密码')
    }
  } catch (err) {
    console.error('登录失败:', err)
    ElMessage.error('登录失败，请重试')
  }
}

// 处理注册
const handleRegister = async (): Promise<void> => {
  try {
    const request: RegisterRequest = {
      username: username.value,
      password: password.value
    }
    
    const result = await register(request)
    if (result.status === true && result.data !== undefined) {
      ElMessage.success(`注册成功，用户ID: ${result.data}`)
      // 注册成功后切换到登录模式
      isLogin.value = true
      username.value = result.data.toString()
    } else {
      ElMessage.error('注册失败')
    }
  } catch (err) {
    console.error('注册失败:', err)
    ElMessage.error('注册失败，请重试')
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box;
}

.login-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.logo-icon {
  font-size: 32px;
}

.app-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.app-subtitle {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.login-form {
  .username-input-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
  }
  
  .username-input {
    flex: 1;
    
    :deep(.el-input__wrapper) {
      border-radius: 12px;
      border: 2px solid #f0f0f0;
      transition: all 0.3s ease;
      box-shadow: none;
      height: 48px;
      
      &:hover {
        border-color: #409eff;
      }
      
      &.is-focus {
        border-color: #409eff;
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
      }
    }
    
    :deep(.el-input__inner) {
      height: 48px;
      font-size: 16px;
    }
  }
  
  .account-dropdown {
    margin-left: 8px;
    
    .dropdown-btn {
      height: 48px;
      width: 40px;
      border: 2px solid #f0f0f0;
      border-radius: 12px;
      background: white;
      color: #666;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        border-color: #409eff;
        color: #409eff;
      }
      
      .el-icon {
        font-size: 16px;
      }
    }
  }
  
  .dropdown-account-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 8px 0;
  }
  
  .account-id {
    font-weight: 500;
  }
  
  .account-saved-tag {
    font-size: 12px;
    color: #409eff;
    background: rgba(64, 158, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 2px solid #409eff;
    border-top: none;
    border-radius: 0 0 12px 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .autocomplete-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background 0.2s ease;
    
    &:hover {
      background: #f5f7fa;
    }
    
    &:first-child {
      border-radius: 0 0 0 10px;
    }
    
    &:last-child {
      border-radius: 0 0 10px 10px;
    }
  }
  
  .autocomplete-id {
    font-weight: 500;
    color: #333;
  }
  
  .autocomplete-saved {
    font-size: 12px;
    color: #409eff;
    background: rgba(64, 158, 255, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .custom-input {
    :deep(.el-input__wrapper) {
      border-radius: 12px;
      border: 2px solid #f0f0f0;
      transition: all 0.3s ease;
      box-shadow: none;
      
      &:hover {
        border-color: #409eff;
      }
      
      &.is-focus {
        border-color: #409eff;
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
      }
    }
    
    :deep(.el-input__inner) {
      height: 48px;
      font-size: 16px;
    }
  }
  
  .remember-checkbox {
    margin: 16px 0;
    
    :deep(.el-checkbox__label) {
      color: #666;
      font-size: 14px;
    }
  }
  
  .submit-btn {
    width: 100%;
    height: 48px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    border: none;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  .bottom-links {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
  }
  
  .link-btn {
    color: #409eff;
    font-size: 14px;
    cursor: pointer;
    transition: color 0.3s ease;
    
    &:hover {
      color: #66b1ff;
      text-decoration: underline;
    }
  }
}

// 响应式设计
@media (max-width: 480px) {
  .login-container {
    padding: 10px;
  }
  
  .login-card {
    padding: 30px 20px;
  }
  
  .app-title {
    font-size: 24px;
  }
  
  .bottom-links {
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
}
</style>
