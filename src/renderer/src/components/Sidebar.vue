<template>
  <nav class="sidebar" :class="{ collapsed: isCollapsed }">
    <el-dropdown trigger="click" @command="handleMenuCommand">
      <template #default>
        <div class="sidebar-user">
          <el-avatar :src="userInfo.avatar" size="large">
            {{ userInfo.username ? userInfo.username.charAt(0) : '?' }}
          </el-avatar>
          <span v-if="!isCollapsed" class="username">{{ userInfo.username }}</span>
        </div>
      </template>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="profile">查看个人信息</el-dropdown-item>
          <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <div class="sidebar-header">
      <span v-if="!isCollapsed">Uchat</span>
      <el-icon class="collapse-btn" @click="toggleCollapse">
        <component :is="isCollapsed ? 'Expand' : 'Fold'" />
      </el-icon>
    </div>
    <ul>
      <li :class="{ active: isActive('/chat') }" @click="goTo('/chat')">
        <el-icon><ChatDotRound /></el-icon>
        <span>聊天</span>
      </li>
      <li :class="{ active: isActive('/contact') }" @click="goTo('/contact')">
        <el-icon><User /></el-icon>
        <span>联系人</span>
      </li>
      <li :class="{ active: isActive('/settings') }" @click="goTo('/settings')">
        <el-icon><Setting /></el-icon>
        <span>设置</span>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChatDotRound, User, Setting } from '@element-plus/icons-vue'
import {
  ElAvatar,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElIcon,
  ElMessage
} from 'element-plus'
import { logout } from '../ipcApi'
import { avatarStore } from '../stores/avatarStore'

const router = useRouter()
const route = useRoute()
const goTo = (path: string): void => {
  if (route.path !== path) router.push(path)
}
const isActive = (path: string): boolean => {
  if (path === '/chat') {
    return route.path.startsWith('/chat')
  }
  return route.path === path
}

const isCollapsed = ref(false)
const toggleCollapse = (): void => {
  isCollapsed.value = !isCollapsed.value
}

// 使用全局头像管理
const { currentUser } = avatarStore

const userInfo = computed(() => ({
  avatar: currentUser.value?.avatarUrl || '',
  username: currentUser.value?.username || ''
}))

onMounted(async () => {
  // 确保头像管理已初始化
  if (!currentUser.value) {
    await avatarStore.initialize()
  }
})

const handleMenuCommand = async (command: string): Promise<void> => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    await logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped>
.sidebar {
  width: 200px;
  min-width: 120px;
  background: #f5f5f5;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #eee;
  transition: width 0.2s;
}

.sidebar.collapsed {
  width: 60px;
  min-width: 60px;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px 8px 18px;
  cursor: pointer;
}
.sidebar-user .username {
  font-weight: bold;
  font-size: 16px;
}
.sidebar.collapsed .sidebar-user .username {
  display: none;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 8px 18px;
  font-weight: bold;
  font-size: 18px;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
}

.sidebar.collapsed .sidebar-header span {
  display: none;
}

.collapse-btn {
  cursor: pointer;
  font-size: 20px;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed ul {
  align-items: center;
}

li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 24px;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
  border-left: 4px solid transparent;
  width: 100%;
}

.sidebar.collapsed li {
  justify-content: center;
  padding: 16px 0;
  gap: 0;
}

li.active,
li:hover {
  background: #e0e7ef;
  color: #409eff;
  border-left: 4px solid #409eff;
  font-weight: bold;
}

.sidebar.collapsed li.active,
.sidebar.collapsed li:hover {
  border-left: none;
  background: #e0e7ef;
}

li .el-icon {
  font-size: 22px;
}

li span {
  white-space: nowrap;
}

.sidebar.collapsed li span {
  display: none;
}

/* 可选：移动端默认折叠 */
@media (max-width: 700px) {
  .sidebar {
    width: 60px;
    min-width: 60px;
  }
}
</style>
