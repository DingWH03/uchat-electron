<template>
  <div class="friend-list-container">
    <!-- 展开/收起按钮 -->
    <button class="toggle-btn" @click="toggleExpand">
      {{ isExpanded ? '收起好友列表' : '展开好友列表' }}
    </button>

    <!-- 好友列表 -->
    <div v-if="isExpanded" class="friend-list">
      <!-- 搜索框 -->
      <input v-model="searchQuery" placeholder="搜索好友..." class="search-input" />

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
    <div class="bottom-buttons">
      <button class="create" @click="create">创建</button>
      <button class="back" @click="back">返回</button>
    </div>
    <!-- 已选好友展示 -->
    <div v-if="selectedFriendIds.length > 0" class="selected-friends">
      <h4>已选好友ID：</h4>
      <div class="selected-ids">
        {{ selectedFriendIds.join(', ') }}
      </div>
      <button class="clear-btn" @click="clearSelection">清空选择</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RequestResponse } from '@/types/HttpRespond'
import { friend_list_v2, group_new } from '@renderer/ipcApi'
import router from '@renderer/router'
import { ref, computed, onMounted } from 'vue' // 替换为您的实际API路径

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
const groupName = ref('')

const create = async (): Promise<void> => {
  const request = {
    group_name: groupName.value,
    members: [...selectedFriendIds.value] // 解构Proxy得到纯数组
  }

  // console.log('处理后数据:', JSON.parse(JSON.stringify(request))) // 验证可序列化
  const result = await group_new(request)
  if (result.status == true) {
    // console.log(result.message)
    back()
  }
}
const back = (): void => {
  router.push('/chat')
}
// 获取好友列表
const f5 = async (): Promise<void> => {
  const flist: RequestResponse<UserSimpleInfoWithStatus[]> = await friend_list_v2()
  if (flist.status === true && flist.data) {
    friendList.value = flist.data ?? []
    // console.log('好友列表加载完成:', friendList.value)
  }
}

// 初始化加载数据
onMounted(() => {
  f5()
})

// 过滤后的好友列表
const filteredFriends = computed(() => {
  return friendList.value.filter((friend) =>
    friend.base.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 展开/收起切换
const toggleExpand = (): void => {
  isExpanded.value = !isExpanded.value
}

// 切换好友选择状态
const toggleFriendSelection = (friendId: number): void => {
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
const clearSelection = (): void => {
  selectedFriendIds.value = []
}
</script>
<style scoped>
.friend-list-container {
  max-width: 480px;
  margin: 40px auto;
  background: #ffffffcc;
  padding: 25px 30px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  font-family: 'Segoe UI', sans-serif;
}

.toggle-btn {
  width: 100%;
  padding: 10px 16px;
  margin-bottom: 15px;
  background-color: #3498db;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.toggle-btn:hover {
  background-color: #2980b9;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}

.friend-list {
  border: 1px solid #ddd;
  border-radius: 8px;
  max-height: 350px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.friend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.friend-item:hover {
  background-color: #f5faff;
}

.friend-item.selected {
  background-color: #e3f2fd;
  font-weight: 600;
}

.status {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.friend-item.online .status::before {
  content: '';
  width: 8px;
  height: 8px;
  background-color: #2ecc71;
  border-radius: 50%;
  margin-right: 6px;
}

.friend-item:not(.online) .status::before {
  content: '';
  width: 8px;
  height: 8px;
  background-color: #bdc3c7;
  border-radius: 50%;
  margin-right: 6px;
}

.username {
  flex-grow: 1;
  font-size: 15px;
}

input[type='text'] {
  width: 100%;
  padding: 10px 12px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 14px;
}

button {
  padding: 10px 16px;
  font-size: 14px;
  margin: 5px 4px 0 0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

button:hover {
  opacity: 0.95;
}

button.create {
  background-color: #27ae60;
  color: white;
}

button.back {
  background-color: #e67e22;
  color: white;
}

.selected-friends {
  margin-top: 20px;
  background-color: #f0f4f8;
  padding: 15px;
  border-radius: 8px;
}

.selected-friends h4 {
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.selected-ids {
  background-color: #fff;
  padding: 8px 10px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 14px;
  color: #333;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  word-break: break-all;
}

.clear-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.clear-btn:hover {
  background-color: #c0392b;
}

.friend-list-container {
  position: relative;
  padding-bottom: 70px;
  /* 给底部按钮留空间 */
}

.bottom-buttons {
  position: absolute;
  bottom: 15px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
}

.bottom-buttons .create {
  background-color: #27ae60;
  color: white;
}

.bottom-buttons .back {
  background-color: #e67e22;
  color: white;
}
</style>

