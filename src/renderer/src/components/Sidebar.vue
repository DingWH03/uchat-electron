<template>
  <nav class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <span v-if="!isCollapsed">聊天应用</span>
      <el-icon class="collapse-btn" @click="toggleCollapse">
        <component :is="isCollapsed ? 'Expand' : 'Fold'" />
      </el-icon>
    </div>
    <ul>
      <li :class="{active: isActive('/chat')}" @click="goTo('/chat')">
        <el-icon><ChatDotRound /></el-icon>
        <span v-if="!isCollapsed">聊天</span>
      </li>
      <li :class="{active: isActive('/contact')}" @click="goTo('/contact')">
        <el-icon><User /></el-icon>
        <span v-if="!isCollapsed">联系人</span>
      </li>
      <li :class="{active: isActive('/settings')}" @click="goTo('/settings')">
        <el-icon><Setting /></el-icon>
        <span v-if="!isCollapsed">设置</span>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChatDotRound, User, Setting } from '@element-plus/icons-vue'

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
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 8px 18px;
  font-weight: bold;
  font-size: 18px;
}
.collapse-btn {
  cursor: pointer;
  font-size: 20px;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 24px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  border-left: 4px solid transparent;
}
li.active, li:hover {
  background: #e0e7ef;
  color: #409eff;
  border-left: 4px solid #409eff;
  font-weight: bold;
}
li .el-icon {
  font-size: 20px;
}
@media (max-width: 700px) {
  .sidebar {
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    height: 100vh;
    width: 60px;
    min-width: 60px;
    padding: 0;
    transition: left 0.2s;
  }
  .sidebar-header span {
    display: none;
  }
  li span {
    display: none;
  }
}
</style> 