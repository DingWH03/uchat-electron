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
        <span v-if="chatType === 'friend' && currentFriend"
          >与 {{ currentFriend.base.username }} 聊天</span
        >
        <span v-else-if="chatType === 'group' && currentGroup">群聊：{{ currentGroup.title }}</span>
      </div>
      <div
        v-if="
          chatType &&
          ((chatType === 'friend' && currentFriend) || (chatType === 'group' && currentGroup))
        "
        ref="messageContainer"
        class="chat-content"
      >
        <div v-for="msg in friend_msg" :key="msg.timestamp">
          <MessageBubble
            :msg="msg"
            :is-mine="msg.sender_id == myidConst"
            :is-group="chatType === 'group'"
          />
        </div>
      </div>
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
        <input v-model="newMessage" placeholder="请输入你的消息…" @keyup.enter="send_message" />
        <button @click="send_message">发送</button>
      </div>
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
  friend_list
} from '../ipcApi'
import { GroupSimpleInfo, SessionMessage, MessageType } from '@apiType/HttpRespond'
import { UserSimpleInfoWithStatus } from '@apiType/HttpRespond'
import {
  notificationManager,
  showMessageNotification,
  showErrorNotification
} from '@renderer/utils/notification'
import MessageBubble from '../components/MessageBubble.vue'
import ConversationListPanel from '../components/ConversationListPanel.vue'
import { ServerMessage } from '@apiType/WebsocketRespond'
import type { Conversation, ApiResponse } from '@apiType/Model'

const route = useRoute()
const router = useRouter()
const messageContainer = ref<HTMLElement | null>(null)
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
    if (messageContainer.value)
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  })
}

onMounted(async () => {
  myidConst.value = await myid()

  // 设置通知管理器的当前用户ID
  notificationManager.setCurrentUserId(myidConst.value)

  // 加载通知设置
  notificationManager.loadSettings()

  const flist: ApiResponse<UserSimpleInfoWithStatus[]> = await friend_list()
  if (flist.success === true) friendList.value = flist.data ?? []
  const glist: ApiResponse<GroupSimpleInfo[]> = await group_list()
  if (glist.success === true) groupList.value = glist.data ?? []
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
        if (messageContainer.value)
          messageContainer.value.scrollTop = messageContainer.value.scrollHeight
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
        if (messageContainer.value)
          messageContainer.value.scrollTop = messageContainer.value.scrollHeight
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
    if (messageContainer.value)
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  })
}
</script>
<style>
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
  display: flex;
  flex-direction: column;
  padding: 0 0 0 0;
}
.sidebar-section {
  padding: 24px 18px;
}
.sidebar-section h2 {
  font-size: 17px;
  margin-bottom: 10px;
  color: #409eff;
  font-weight: bold;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0 0 18px 0;
}
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 6px;
}
.sidebar-item:last-child {
  border-bottom: none;
}
.sidebar-item.active {
  background: #e6f7ff;
  color: #409eff;
  font-weight: bold;
}
.icon {
  font-size: 18px;
}
.name {
  flex: 1;
}
.status {
  font-size: 13px;
  margin-left: 6px;
}
.online {
  color: #52c41a;
}
.offline {
  color: #bfbfbf;
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
}
.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 0 32px 0;
  background: #f7faff;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.message-row {
  display: flex;
  align-items: flex-end;
  margin-bottom: 18px;
  padding-left: 16px;
  padding-right: 16px;
}
.message-row.mine {
  flex-direction: row-reverse;
  justify-content: flex-end;
}
.message-row.theirs {
  justify-content: flex-start;
}
.avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 8px;
  min-width: 48px;
}
.msg-username {
  font-size: 13px;
  color: #8a8a8a;
  margin-bottom: 2px;
  text-align: center;
  word-break: break-all;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e6f7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.bubble-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 70%;
}
.message-row.mine .bubble-block {
  align-items: flex-end;
}
.bubble {
  background: #fff;
  border-radius: 16px;
  padding: 12px 18px;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  position: relative;
  min-width: 36px;
  max-width: 100%;
  margin: 0 2px;
}
.bubble.mine {
  background: #e6f7ff;
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
.chat-input input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #ccc;
  border-radius: 20px;
  font-size: 15px;
  outline: none;
  background: #f7faff;
}
.chat-input button {
  padding: 8px 22px;
  border: none;
  background-color: #409eff;
  color: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.2s;
}
.chat-input button:hover {
  background-color: #307fd6;
}
#back-container {
  text-align: center;
  margin-top: 10px;
}
.back-btn {
  padding: 8px 16px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.back-btn:hover {
  background-color: #d9363e;
}
.square-btn {
  padding: 8px 16px;
  margin: 0;
  background-color: #007aff;
  color: white;
  border: 1px solid #007aff;
  border-radius: 0;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s ease;
}
.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #bfbfbf;
}
.empty-icon {
  font-size: 64px;
  margin-bottom: 18px;
}
.empty-tip {
  font-size: 18px;
}
</style>
