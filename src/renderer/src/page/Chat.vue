<template>
  <div class="chat-layout">
    <div class="chat-sidebar">
      <ConversationListPanel
        ref="conversationListRef"
        :selected-type="chatType"
        :selected-id="chatId"
        @select-conversation="handleSelectConversation"
      />
    </div>
    <div class="chat-main">
      <div
        v-if="
          chatType &&
          ((chatType === 'friend' && currentFriend) || (chatType === 'group' && currentGroup))
        "
        class="chat-header"
      >
        <div class="chat-header-title">
          <span v-if="chatType === 'friend' && currentFriend"
            >与 {{ currentFriend.base.username }} 聊天</span
          >
          <span v-else-if="chatType === 'group' && currentGroup"
            >群聊：{{ currentGroup.title }}</span
          >
        </div>
        <el-button class="profile-btn" size="small" @click="showProfileDialog = true"
          >资料</el-button
        >
      </div>
      <MessageList
        v-if="
          chatType &&
          ((chatType === 'friend' && currentFriend) || (chatType === 'group' && currentGroup))
        "
        ref="messageListRef"
        :messages="friend_msg"
        :my-id="myidConst"
        :is-group="chatType === 'group'"
        :loading="false"
      />
      <div v-else class="chat-content chat-empty">
        <div class="empty-icon">💬</div>
        <div class="empty-tip">请选择联系人或群聊开始会话</div>
      </div>
      <div
        v-if="
          chatType &&
          ((chatType === 'friend' && currentFriend) || (chatType === 'group' && currentGroup))
        "
        class="chat-input"
      >
        <input
          v-model="newMessage"
          class="chat-input-box"
          placeholder="请输入你的消息…"
          @keyup.enter="send_message"
        />
        <button class="chat-send-btn" @click="send_message">发送</button>
      </div>
      <el-dialog v-model="showProfileDialog" width="360px" :show-close="true" center>
        <template #header>
          <span v-if="chatType === 'friend'">好友信息</span>
          <span v-else-if="chatType === 'group'">群聊信息</span>
        </template>
        <div v-if="chatType === 'friend' && currentFriend" class="profile-dialog-content">
          <div class="profile-avatar-row">
            <el-avatar :src="currentFriend.base.avatar_url" size="large" />
            <div class="profile-info-main">
              <div class="profile-username">{{ currentFriend.base.username }}</div>
              <div class="profile-id">ID: {{ currentFriend.base.user_id }}</div>
            </div>
          </div>
          <div class="profile-actions">
            <el-button type="danger" size="small" @click="deleteFriend(currentFriend.base.user_id)"
              >删除好友</el-button
            >
          </div>
        </div>
        <div v-else-if="chatType === 'group' && currentGroup" class="profile-dialog-content">
          <div class="profile-avatar-row">
            <el-avatar :src="currentGroup.avatar_url" size="large" />
            <div class="profile-info-main">
              <div class="profile-username">{{ currentGroup.title }}</div>
              <div class="profile-id">群ID: {{ currentGroup.group_id }}</div>
            </div>
          </div>
          <div class="profile-actions">
            <el-button type="danger" size="small" @click="quitGroup(currentGroup.group_id)"
              >退出群聊</el-button
            >
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, nextTick, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  sendMessage,
  myid,
  group_list,
  getLocalPrivateMessages,
  getLocalGroupMessages,
  friend_list,
  group_leave
} from '../ipcApi'
import { GroupSimpleInfo, SessionMessage, MessageType } from '@apiType/HttpRespond'
import { UserSimpleInfoWithStatus } from '@apiType/HttpRespond'
import {
  notificationManager,
  showMessageNotification,
  showErrorNotification
} from '@renderer/utils/notification'
import MessageList from '../components/MessageList.vue'
import ConversationListPanel from '../components/ConversationListPanel.vue'
import { ServerMessage } from '@apiType/WebsocketRespond'
import type { Conversation, ApiResponse } from '@apiType/Model'
import { getSecureFriendAvatarUrls, getSecureGroupAvatarUrls } from '../utils/fileUtils'
import { avatarStore } from '../stores/avatarStore'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const messageListRef = ref<InstanceType<typeof MessageList> | null>(null)
const conversationListRef = ref<InstanceType<typeof ConversationListPanel> | null>(null)
const myidConst = ref<number>(0)
const friendList = ref<UserSimpleInfoWithStatus[]>([])
const groupList = ref<GroupSimpleInfo[]>([])
const friend_msg = ref<SessionMessage[]>([])
const newMessage = ref('')
const chatType = ref('')
const chatId = ref<number | null>(null)
const currentFriend = ref<UserSimpleInfoWithStatus | null>(null)
const currentGroup = ref<GroupSimpleInfo | null>(null)
const showProfileDialog = ref(false)

async function deleteFriend(userId: number): Promise<void> {
  // TODO: 调用删除好友接口
  ElMessage.success('已删除好友（示例）')
  showProfileDialog.value = false
}
async function quitGroup(groupId: number): Promise<void> {
  const res = await group_leave({
    id: groupId
  })
  if (res.success) {
    ElMessage.success('已退出群聊')
  } else {
    ElMessage.error(res.error)
  }
  showProfileDialog.value = false
}

// 本地数据库返回的消息结构
interface LocalSessionMessage {
  sender_id: number
  message_type: string
  content: string
  timestamp: number
}

function handleSelectConversation(conversation: Conversation): void {
  if (conversation.conversation_type === 'friend') {
    router.push(`/chat/friend/${conversation.target_id}`)
  } else if (conversation.conversation_type === 'group') {
    router.push(`/chat/group/${conversation.target_id}`)
  }
}

async function loadSession(): Promise<void> {
  chatType.value = ''
  chatId.value = null
  currentFriend.value = null
  currentGroup.value = null
  friend_msg.value = []
  let type = ''
  let id = route.params.id
  if (route.name === 'ChatFriend') {
    type = 'friend'
  } else if (route.name === 'ChatGroup') {
    type = 'group'
  }
  // console.log('route.params:', route.params, 'type:', type, 'id:', id, 'route.name:', route.name)
  if (type === 'friend' && id) {
    chatType.value = 'friend'
    chatId.value = Number(id)
    currentFriend.value = friendList.value.find((f) => f.base.user_id === Number(id)) || null
    if (currentFriend.value) {
      // console.log('[Chat] 加载私聊消息，userId:', Number(id))
      const result = await getLocalPrivateMessages(Number(id), 0, 50)
      // console.log('[Chat] 私聊消息加载结果:', result)
      friend_msg.value = (result ?? []).map((msg: LocalSessionMessage) => ({
        message_id: 0,
        message_type: MessageType.Text,
        sender_id: msg.sender_id,
        message: msg.content,
        timestamp: msg.timestamp
      }))
      // console.log('[Chat] 映射后的私聊消息:', friend_msg.value)
      // 添加时间戳调试信息
      // console.log('[Chat] 消息时间戳详情:')
      // friend_msg.value.forEach((msg, index) => {
      //   console.log(
      //     `[Chat] 消息${index + 1}: ${msg.message} - 时间戳: ${msg.timestamp} - 时间: ${new Date(msg.timestamp).toLocaleString()}`
      //   )
      // })
    }
  } else if (type === 'group' && id) {
    chatType.value = 'group'
    chatId.value = Number(id)
    currentGroup.value = groupList.value.find((g) => g.group_id === Number(id)) || null
    if (currentGroup.value) {
      // console.log('[Chat] 加载群聊消息，groupId:', Number(id))
      const result = await getLocalGroupMessages(Number(id), 0, 50)
      // console.log('[Chat] 群聊消息加载结果:', result)
      friend_msg.value = (result ?? []).map((msg: LocalSessionMessage) => ({
        message_id: 0,
        message_type: MessageType.Text,
        sender_id: msg.sender_id,
        message: msg.content,
        timestamp: msg.timestamp
      }))
      // console.log('[Chat] 映射后的群聊消息:', friend_msg.value)
      // 添加时间戳调试信息
      // console.log('[Chat] 群聊消息时间戳详情:')
      // friend_msg.value.forEach((msg, index) => {
      //   console.log(
      //     `[Chat] 群聊消息${index + 1}: ${msg.message} - 时间戳: ${msg.timestamp} - 时间: ${new Date(msg.timestamp).toLocaleString()}`
      //   )
      // })
    }
  }
  nextTick(() => {
    if (messageListRef.value) messageListRef.value.scrollToBottom()
  })
}

onMounted(async () => {
  myidConst.value = await myid()

  // 设置通知管理器的当前用户ID
  notificationManager.setCurrentUserId(myidConst.value)

  // 加载通知设置
  notificationManager.loadSettings()

  // 初始化全局头像管理
  await avatarStore.initialize()

  // 加载好友和群组列表（用于其他功能）
  const flist: ApiResponse<UserSimpleInfoWithStatus[]> = await friend_list()
  if (flist.success === true) {
    const friends = flist.data ?? []
    // 处理好友头像（保持向后兼容）
    friendList.value = await getSecureFriendAvatarUrls(friends)
  }
  const glist: ApiResponse<GroupSimpleInfo[]> = await group_list()
  if (glist.success === true) {
    const groups = glist.data ?? []
    // 处理群组头像（保持向后兼容）
    groupList.value = await getSecureGroupAvatarUrls(groups)
  }
  await loadSession()

  // 监听WebSocket消息
  window.api.onWSMessage((message: ServerMessage) => {
    // console.log('[Chat] 收到WebSocket消息:', message)
    handleWebSocketMessage(message)
  })
})

onUnmounted(() => {
  // 清理WebSocket监听
  // 注意：ipcRenderer的监听器在页面卸载时会自动清理
})

// 处理WebSocket消息
function handleWebSocketMessage(message: ServerMessage): void {
  if (message.type === 'SendMessage') {
    // 私聊消息
    const senderId = message.sender
    const receiverId = message.receiver
    const myId = myidConst.value

    // 判断是否是当前聊天：发送者或接收者是当前聊天对象
    const isCurrentChat =
      chatType.value === 'friend' &&
      chatId.value &&
      (chatId.value === senderId || chatId.value === receiverId)

    // 如果当前正在与发送者或接收者聊天，直接添加到消息列表
    if (isCurrentChat) {
      friend_msg.value.push({
        message_id: message.message_id,
        message_type: MessageType.Text,
        sender_id: senderId,
        message: message.message,
        timestamp: message.timestamp
      })
      nextTick(() => {
        if (messageListRef.value) messageListRef.value.scrollToBottom()
      })
    } else {
      // 如果不是当前聊天，显示通知
      const sender = friendList.value.find((f) => f.base.user_id === senderId)
      if (sender) {
        showMessageNotification({
          senderId: senderId,
          senderName: sender.base.username,
          message: message.message,
          chatType: 'private'
        })
      }
    }

    // 延迟刷新会话列表，确保数据库已更新
    if (conversationListRef.value) {
      setTimeout(() => {
        // 使用发送者或接收者中不是自己的那个作为会话目标
        const targetId = senderId === myId ? receiverId : senderId
        conversationListRef.value?.updateConversation('friend', targetId)
      }, 100)
    }
  } else if (message.type === 'SendGroupMessage') {
    // 群聊消息
    const groupId = message.group_id
    const isCurrentChat = chatType.value === 'group' && chatId.value === groupId

    // 如果当前正在该群聊天，直接添加到消息列表
    if (isCurrentChat) {
      friend_msg.value.push({
        message_id: message.message_id,
        message_type: MessageType.Text,
        sender_id: message.sender,
        message: message.message,
        timestamp: message.timestamp
      })
      nextTick(() => {
        if (messageListRef.value) messageListRef.value.scrollToBottom()
      })
    } else {
      // 如果不是当前聊天，显示通知
      const group = groupList.value.find((g) => g.group_id === groupId)
      if (group) {
        showMessageNotification({
          senderId: message.sender,
          senderName: '群成员', // 这里可以进一步优化，获取发送者的用户名
          message: message.message,
          chatType: 'group',
          groupName: group.title
        })
      }
    }

    // 延迟刷新会话列表，确保数据库已更新
    if (conversationListRef.value) {
      setTimeout(() => {
        conversationListRef.value?.updateConversation('group', groupId)
      }, 100)
    }
  }
}

watch(() => route.fullPath, loadSession)

async function send_message(): Promise<void> {
  if (!newMessage.value.trim() || !chatType.value || !chatId.value) return
  // console.log('[Chat] 开始发送消息:', {
  //   type: chatType.value,
  //   id: chatId.value,
  //   message: newMessage.value
  // })

  if (chatType.value === 'friend' && currentFriend.value) {
    const message = {
      type: 'SendMessage' as const,
      receiver: chatId.value,
      message: newMessage.value
    }
    // console.log('[Chat] 发送私聊WebSocket消息:', message)
    const sendSuccess = await sendMessage(message)
    // console.log('[Chat] WebSocket发送结果:', sendSuccess)

    if (sendSuccess) {
      // console.log('[Chat] WebSocket发送成功，等待服务器确认')
      // 清空输入框，消息将通过WebSocket返回后添加到界面
      newMessage.value = ''

      // 延迟刷新会话列表，确保数据库已更新
      if (conversationListRef.value && chatId.value !== null) {
        setTimeout(() => {
          conversationListRef.value?.updateConversation('friend', chatId.value!)
        }, 100)
      }
    } else {
      console.error('[Chat] WebSocket发送失败')
      showErrorNotification('发送失败', '消息发送失败，请检查网络连接')
    }
  } else if (chatType.value === 'group' && currentGroup.value) {
    const message = {
      type: 'SendGroupMessage' as const,
      group_id: chatId.value,
      message: newMessage.value
    }
    // console.log('[Chat] 发送群聊WebSocket消息:', message)
    const sendSuccess = await sendMessage(message)
    // console.log('[Chat] WebSocket发送结果:', sendSuccess)

    if (sendSuccess) {
      // console.log('[Chat] WebSocket发送成功，等待服务器确认')
      // 清空输入框，消息将通过WebSocket返回后添加到界面
      newMessage.value = ''

      // 延迟刷新会话列表，确保数据库已更新
      if (conversationListRef.value && chatId.value !== null) {
        setTimeout(() => {
          conversationListRef.value?.updateConversation('group', chatId.value!)
        }, 100)
      }
    } else {
      console.error('[Chat] WebSocket发送失败')
      showErrorNotification('发送失败', '消息发送失败，请检查网络连接')
    }
  }
  nextTick(() => {
    if (messageListRef.value) messageListRef.value.scrollToBottom()
  })
}
</script>
<style scoped>
.chat-layout {
  display: flex;
  height: 100%;
  background: #f7faff;
}
.chat-sidebar {
  width: 280px;
  min-width: 180px;
  background: #fff;
  border-right: 1px solid #e6e6e6;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.03);
}
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f7faff;
  border-radius: 0 12px 12px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}
.chat-header {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 32px;
  font-size: 18px;
  color: #409eff;
  border-bottom: 1px solid #e6e6e6;
  background: #fff;
  border-radius: 0 12px 0 0;
  font-weight: bold;
  justify-content: space-between;
}
.chat-header-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.profile-btn {
  margin-left: auto;
}
.profile-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0 0 0;
}
.profile-avatar-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.profile-info-main {
  margin-left: 16px;
}
.profile-username {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
}
.profile-id {
  font-size: 13px;
  color: #888;
}
.profile-actions {
  margin-top: 18px;
  width: 100%;
  display: flex;
  justify-content: center;
}
.chat-input {
  display: flex;
  align-items: center;
  padding: 18px 32px;
  background: #fff;
  border-top: 1px solid #e6e6e6;
  border-radius: 0 0 12px 0;
  gap: 12px;
}
.chat-input-box {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #ccc;
  border-radius: 20px;
  font-size: 15px;
  outline: none;
  background: #f7faff;
}
.chat-send-btn {
  padding: 8px 22px;
  border: none;
  background-color: #409eff;
  color: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.2s;
}
.chat-send-btn:hover {
  background-color: #307fd6;
}
.chat-content.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #bfbfbf;
  background: #f7faff;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 18px;
}
.empty-tip {
  font-size: 18px;
  color: #888;
}
</style>
