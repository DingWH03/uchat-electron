<template>
  <div class="contact-detail-panel">
    <!-- 好友详情 -->
    <div v-if="selectedType === 'friend' && selectedFriend" class="detail-content">
      <h2>好友信息</h2>
      <div class="detail-row"><b>用户名：</b>{{ selectedFriend.base.username }}</div>
      <div class="detail-row"><b>用户ID：</b>{{ selectedFriend.base.user_id }}</div>
      <div class="detail-row">
        <b>状态：</b
        ><span :class="selectedFriend.online ? 'online' : 'offline'">{{
          selectedFriend.online ? '在线' : '离线'
        }}</span>
      </div>
      <button class="open-chat-btn" @click="openChat">打开会话</button>
    </div>

    <!-- 群聊详情 -->
    <div v-else-if="selectedType === 'group' && selectedGroup" class="detail-content">
      <h2>群聊信息</h2>
      <div class="detail-row"><b>群名：</b>{{ selectedGroup.title }}</div>
      <div class="detail-row"><b>群ID：</b>{{ selectedGroup.group_id }}</div>
      <button class="open-chat-btn" @click="openChat">打开会话</button>
    </div>

    <!-- 添加好友表单 -->
    <div v-else-if="showAddFriendForm" class="form-content">
      <h2>添加好友</h2>
      <div class="form-group">
        <label>好友ID：</label>
        <input v-model="friendId" type="number" placeholder="请输入好友ID" />
      </div>
      <div class="form-actions">
        <button class="submit-btn" @click="addFriend">添加</button>
        <button class="cancel-btn" @click="hideAddFriendForm">取消</button>
      </div>
    </div>

    <!-- 创建群聊表单 -->
    <div v-else-if="showCreateGroupForm" class="form-content">
      <h2>创建群聊</h2>
      <div class="form-group">
        <label>群名称：</label>
        <input v-model="groupName" type="text" placeholder="请输入群名称" />
      </div>
      <div class="form-group">
        <label>选择好友：</label>
        <div class="friend-selector-trigger" @click="showFriendSelector = true">
          <div v-if="selectedFriendIds.length === 0" class="placeholder">
            点击选择好友 ({{ friendList.length }}个可选)
          </div>
          <div v-else class="selected-summary">
            已选择 {{ selectedFriendIds.length }} 个好友
            <span class="clear-selection" @click.stop="clearSelection">清空</span>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="submit-btn" @click="createGroup">创建</button>
        <button class="cancel-btn" @click="hideCreateGroupForm">取消</button>
      </div>
    </div>

    <!-- 默认空状态 -->
    <div v-else class="empty-detail">
      <div class="empty-icon">👥</div>
      <div class="empty-text">请选择左侧联系人或群聊</div>
    </div>

    <!-- 好友选择对话框 -->
    <div v-if="showFriendSelector" class="modal-overlay" @click="closeFriendSelector">
      <div class="friend-selector-modal" @click.stop>
        <div class="modal-header">
          <h3>选择好友</h3>
          <button class="close-btn" @click="closeFriendSelector">×</button>
        </div>
        <div class="modal-content">
          <div class="search-box">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索好友..."
              class="search-input"
            />
          </div>
          <div class="friend-list">
            <div
              v-for="friend in filteredFriends"
              :key="friend.base.user_id"
              class="friend-item"
              :class="{ selected: selectedFriendIds.includes(friend.base.user_id) }"
              @click="toggleFriendSelection(friend.base.user_id)"
            >
              <div class="friend-info">
                <span class="friend-avatar">👤</span>
                <div class="friend-details">
                  <span class="friend-name">{{ friend.base.username }}</span>
                  <span class="friend-id">ID: {{ friend.base.user_id }}</span>
                </div>
              </div>
              <div class="friend-status" :class="friend.online ? 'online' : 'offline'">
                {{ friend.online ? '在线' : '离线' }}
              </div>
              <div class="selection-indicator">
                <span v-if="selectedFriendIds.includes(friend.base.user_id)" class="selected-icon"
                  >✓</span
                >
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <div class="selection-info">已选择 {{ selectedFriendIds.length }} 个好友</div>
          <div class="modal-actions">
            <button class="cancel-btn" @click="closeFriendSelector">取消</button>
            <button class="confirm-btn" @click="confirmSelection">确定</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { UserSimpleInfoWithStatus, GroupSimpleInfo, RequestResponse } from '@apiType/HttpRespond'
import { friend_add, group_new } from '../ipcApi'
import { FriendRequest, CreateGroupRequest } from '@apiType/HttpRequest'
import { ElMessage } from 'element-plus'

interface Props {
  selectedType: 'friend' | 'group' | ''
  selectedFriend: UserSimpleInfoWithStatus | null
  selectedGroup: GroupSimpleInfo | null
  friendList: UserSimpleInfoWithStatus[]
  showAddFriendForm: boolean
  showCreateGroupForm: boolean
}

interface Emits {
  (e: 'hide-add-friend-form'): void
  (e: 'hide-create-group-form'): void
  (e: 'refresh-lists'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const router = useRouter()

// 表单数据
const friendId = ref('')
const groupName = ref('')
const selectedFriendIds = ref<number[]>([])

// 好友选择对话框
const showFriendSelector = ref(false)
const searchQuery = ref('')

// 过滤后的好友列表
const filteredFriends = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.friendList
  }
  return props.friendList.filter(
    (friend) =>
      friend.base.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      friend.base.user_id.toString().includes(searchQuery.value)
  )
})

const openChat = (): void => {
  if (props.selectedType === 'friend' && props.selectedFriend) {
    router.push(`/chat/friend/${props.selectedFriend.base.user_id}`)
  } else if (props.selectedType === 'group' && props.selectedGroup) {
    router.push(`/chat/group/${props.selectedGroup.group_id}`)
  }
}

const addFriend = async (): Promise<void> => {
  if (!String(friendId.value).trim()) {
    ElMessage.warning('请输入好友ID')
    return
  }

  try {
    const request: FriendRequest = { id: Number(friendId.value) }
    const result = await friend_add(request)
    if (result.status === true) {
      ElMessage.success('添加好友成功')
      friendId.value = ''
      emit('hide-add-friend-form')
      emit('refresh-lists')
    } else {
      ElMessage.error(result.message || '添加好友失败')
    }
  } catch {
    ElMessage.error('添加好友失败')
  }
}

const createGroup = async (): Promise<void> => {
  if (!groupName.value.trim()) {
    ElMessage.warning('请输入群名称')
    return
  }

  if (selectedFriendIds.value.length === 0) {
    ElMessage.warning('请至少选择一个好友')
    return
  }

  try {
    const request: CreateGroupRequest = {
      group_name: groupName.value,
      members: [...selectedFriendIds.value]
    }
    console.log(request)
    let result: RequestResponse<number>
    try {
      result = await group_new(request)
      console.log('group_new result:', result)
    } catch (e) {
      console.error('创建群聊异常', e)
      ElMessage.error('创建群聊失败')
      return
    }
    if (result && result.status === true) {
      ElMessage.success('创建群聊成功')
      groupName.value = ''
      selectedFriendIds.value = []
      emit('hide-create-group-form')
      emit('refresh-lists')
    } else {
      ElMessage.error(result.message || '创建群聊失败')
    }
  } catch {
    ElMessage.error('创建群聊失败')
  }
}

const toggleFriendSelection = (friendId: number): void => {
  const index = selectedFriendIds.value.indexOf(friendId)
  if (index === -1) {
    selectedFriendIds.value.push(friendId)
  } else {
    selectedFriendIds.value.splice(index, 1)
  }
}

const clearSelection = (): void => {
  selectedFriendIds.value = []
}

const closeFriendSelector = (): void => {
  showFriendSelector.value = false
  searchQuery.value = ''
}

const confirmSelection = (): void => {
  closeFriendSelector()
}

const hideAddFriendForm = (): void => {
  friendId.value = ''
  emit('hide-add-friend-form')
}

const hideCreateGroupForm = (): void => {
  groupName.value = ''
  selectedFriendIds.value = []
  emit('hide-create-group-form')
}
</script>

<style scoped>
.contact-detail-panel {
  flex: 1;
  background: #f7faff;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.detail-content,
.form-content {
  width: 100%;
  max-width: 500px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  padding: 40px 32px;
}

.detail-content h2,
.form-content h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 24px;
  font-weight: bold;
}

.detail-row {
  margin-bottom: 18px;
  font-size: 16px;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #409eff;
}

.friend-selector-trigger {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
  background: #fff;
}

.friend-selector-trigger:hover {
  border-color: #409eff;
}

.placeholder {
  color: #999;
  font-size: 14px;
}

.selected-summary {
  color: #333;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clear-selection {
  color: #409eff;
  font-size: 12px;
  cursor: pointer;
}

.clear-selection:hover {
  text-decoration: underline;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.submit-btn,
.cancel-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn {
  background: #409eff;
  color: #fff;
}

.submit-btn:hover {
  background: #307fd6;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e8e8e8;
}

.open-chat-btn {
  margin-top: 18px;
  padding: 8px 28px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.open-chat-btn:hover {
  background: #307fd6;
}

.empty-detail {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #bfbfbf;
  height: 100%;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 18px;
}

.online {
  color: #52c41a;
}

.offline {
  color: #bfbfbf;
}

/* 模态对话框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.friend-selector-modal {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-content {
  flex: 1;
  padding: 20px 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-box {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #409eff;
}

.friend-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
}

.friend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 4px;
}

.friend-item:hover {
  background: #f5f5f5;
}

.friend-item.selected {
  background: #e6f7ff;
  color: #409eff;
}

.friend-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.friend-avatar {
  font-size: 20px;
}

.friend-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.friend-name {
  font-weight: 500;
  font-size: 14px;
}

.friend-id {
  font-size: 12px;
  color: #999;
}

.friend-status {
  font-size: 12px;
  margin-right: 12px;
}

.selection-indicator {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-icon {
  color: #409eff;
  font-weight: bold;
  font-size: 16px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #eee;
  background: #f9f9f9;
  border-radius: 0 0 12px 12px;
}

.selection-info {
  font-size: 14px;
  color: #666;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.confirm-btn {
  padding: 8px 20px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.confirm-btn:hover {
  background: #307fd6;
}
</style>
