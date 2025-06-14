<template>
  <div class="friend-list-container">
    <!-- 展开/收起按钮 -->
    <button class="toggle-btn" @click="toggleExpand">
      {{ isExpanded ? '收起好友列表' : '展开好友列表' }}
    </button>

    <!-- 好友列表 -->
    <div v-if="isExpanded" class="friend-list">
      <!-- 搜索框 -->
      <input
        v-model="searchQuery"
        placeholder="搜索好友..."
        class="search-input"
      />

      <!-- 好友项 -->
      <div
        v-for="friend in filteredFriends"
        :key="friend.base.user_id"
        class="friend-item"
        :class="{
          selected: selectedFriendIds.includes(friend.base.user_id),
          online: friend.online
        }"
        @click="toggleFriendSelection(friend.base.user_id)"
      >
        <span class="username">{{ friend.base.username }}</span>
        <span class="status">
          {{ friend.online ? '在线' : '离线' }}
        </span>
      </div>
    </div>
    <div><input v-model="groupName" type="text" placeholder="输入群名称" /></div>
    <button @click="create">create</button>
    <button @click="back">back</button>
    <!-- 已选好友展示 -->
    <div v-if="selectedFriendIds.length > 0" class="selected-friends">
      <h4>已选好友ID：</h4>
      <div class="selected-ids">
        {{ selectedFriendIds.join(', ') }}
      </div>
      <button @click="clearSelection" class="clear-btn">清空选择</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CreateGroupRequest } from '@/types/HttpRequest'
import { ServerResponse } from '@/types/HttpRespond'
import { friend_list_v2, group_new } from '@renderer/ipcApi'
import router from '@renderer/router'
import { ref, computed, onMounted } from 'vue'// 替换为您的实际API路径

interface UserSimpleInfo {
  user_id: number
  username: string
}

interface UserSimpleInfoWithStatus {
  base: UserSimpleInfo
  online: boolean
}


// 响应式数据
const friendList = ref<UserSimpleInfoWithStatus[]>([])
const isExpanded = ref(false)
const selectedFriendIds = ref<number[]>([])
const searchQuery = ref('')
const groupName=ref('')

const create = async () => {
  const request = {
    group_name: groupName.value,
    members: [...selectedFriendIds.value] // 解构Proxy得到纯数组
  }

  console.log('处理后数据:', JSON.parse(JSON.stringify(request))) // 验证可序列化
  const result = await group_new(request)
  if (result.action == 'generic_response') {
    console.log(result.message)
  }
}
const back = (): void => {
  router.push('/chat')
}
// 获取好友列表
const f5 = async () => {
  const flist: ServerResponse = await friend_list_v2()
  if (flist.action === 'friend_list_with_status' && flist.friends) {
    friendList.value = flist.friends
    console.log('好友列表加载完成:', friendList.value)
  }
}

// 初始化加载数据
onMounted(() => {
  f5()
})

// 过滤后的好友列表
const filteredFriends = computed(() => {
  return friendList.value.filter(friend =>
    friend.base.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 展开/收起切换
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// 切换好友选择状态
const toggleFriendSelection = (friendId: number) => {
  const index = selectedFriendIds.value.indexOf(friendId)
  if (index === -1) {
    // 添加选中
    selectedFriendIds.value.push(friendId)
  } else {
    // 移除选中
    selectedFriendIds.value.splice(index, 1)
  }
}

// 清空选择
const clearSelection = () => {
  selectedFriendIds.value = []
}
</script>

<style scoped>
.friend-list-container {
  max-width: 400px;
  margin: 20px;
  font-family: 'Arial', sans-serif;
}

.toggle-btn {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
  transition: background-color 0.2s;
}

.toggle-btn:hover {
  background-color: #2980b9;
}

.search-input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.friend-list {
  border: 1px solid #eee;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.friend-item {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: all 0.2s;
}

.friend-item:hover {
  background-color: #f5f5f5;
}

.friend-item.selected {
  background-color: #e3f2fd;
  font-weight: bold;
}

.friend-item.online .status {
  color: #2ecc71;
}

.friend-item:not(.online) .status {
  color: #95a5a6;
}

.username {
  flex-grow: 1;
}

.selected-friends {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.selected-ids {
  margin: 10px 0;
  padding: 8px;
  background-color: white;
  border-radius: 3px;
  font-family: monospace;
}

.clear-btn {
  padding: 6px 12px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.clear-btn:hover {
  background-color: #c0392b;
}
</style>