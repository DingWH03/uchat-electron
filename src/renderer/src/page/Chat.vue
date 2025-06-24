<template>
  <div class="chat-layout">
    <div class="chat-sidebar">
      <div class="sidebar-section">
        <h2>联系人</h2>
        <ul>
          <li
            v-for="friend in friendList"
            :key="friend.base.user_id"
            class="sidebar-item"
            :class="{ active: isActiveFriend(friend) }"
            @click="goToFriend(friend)"
          >
            <span class="icon">👤</span>
            <span class="name">{{ friend.base.username }}</span>
            <span class="status" :class="friend.online ? 'online' : 'offline'">{{
              friend.online ? '在线' : '离线'
            }}</span>
          </li>
        </ul>
        <h2>群聊</h2>
        <ul>
          <li
            v-for="group in groupList"
            :key="group.group_id"
            class="sidebar-item"
            :class="{ active: isActiveGroup(group) }"
            @click="goToGroup(group)"
          >
            <span class="icon">👥</span>
            <span class="name">{{ group.title }}</span>
          </li>
        </ul>
      </div>
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
import { ref, nextTick, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  friend_list_v2,
  friend_messages,
  sendMessage,
  myid,
  group_list,
  group_messages
} from '../ipcApi'
import { GroupSimpleInfo, RequestResponse, SessionMessage } from '@apiType/HttpRespond'
import { UserSimpleInfoWithStatus } from '@apiType/HttpRespond'
import { MessageRequest } from '@apiType/HttpRequest'
import { showNotification } from '@renderer/utils/notification'
import MessageBubble from '../components/MessageBubble.vue'

const route = useRoute()
const router = useRouter()
const messageContainer = ref<HTMLElement | null>(null)
const myidConst = ref<number>(0)
const friendList = ref<UserSimpleInfoWithStatus[]>([])
const groupList = ref<GroupSimpleInfo[]>([])
const friend_msg = ref<SessionMessage[]>([])
const newMessage = ref('')
const chatType = ref('')
const chatId = ref<number | null>(null)
const currentFriend = ref<UserSimpleInfoWithStatus | null>(null)
const currentGroup = ref<GroupSimpleInfo | null>(null)

function isActiveFriend(friend: UserSimpleInfoWithStatus): boolean {
  return chatType.value === 'friend' && chatId.value === friend.base.user_id
}
function isActiveGroup(group: GroupSimpleInfo): boolean {
  return chatType.value === 'group' && chatId.value === group.group_id
}
function goToFriend(friend: UserSimpleInfoWithStatus): void {
  router.push(`/chat/friend/${friend.base.user_id}`)
}
function goToGroup(group: GroupSimpleInfo): void {
  router.push(`/chat/group/${group.group_id}`)
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
  console.log('route.params:', route.params, 'type:', type, 'id:', id, 'route.name:', route.name)
  if (type === 'friend' && id) {
    chatType.value = 'friend'
    chatId.value = Number(id)
    currentFriend.value = friendList.value.find((f) => f.base.user_id === Number(id)) || null
    if (currentFriend.value) {
      const request: MessageRequest = { id: Number(id), offset: 0 }
      const result = await friend_messages(request)
      if (result.status === true) friend_msg.value = result.data ?? []
    }
  } else if (type === 'group' && id) {
    chatType.value = 'group'
    chatId.value = Number(id)
    currentGroup.value = groupList.value.find((g) => g.group_id === Number(id)) || null
    if (currentGroup.value) {
      const request: MessageRequest = { id: Number(id), offset: 0 }
      const result = await group_messages(request)
      if (result.status === true) friend_msg.value = result.data ?? []
    }
  }
  nextTick(() => {
    if (messageContainer.value)
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  })
}

onMounted(async () => {
  showNotification('登录成功', '欢迎回来！', '')
  myidConst.value = await myid()
  const flist: RequestResponse<UserSimpleInfoWithStatus[]> = await friend_list_v2()
  if (flist.status === true) friendList.value = flist.data ?? []
  const glist: RequestResponse<GroupSimpleInfo[]> = await group_list()
  if (glist.status === true) groupList.value = glist.data ?? []
  await loadSession()
})

watch(() => route.fullPath, loadSession)

function send_message(): void {
  if (!newMessage.value.trim() || !chatType.value || !chatId.value) return
  if (chatType.value === 'friend' && currentFriend.value) {
    const message = {
      type: 'SendMessage' as const,
      receiver: chatId.value,
      message: newMessage.value
    }
    sendMessage(message)
    friend_msg.value.push({
      sender_id: myidConst.value,
      message: newMessage.value,
      timestamp: new Date().toISOString()
    })
    newMessage.value = ''
  } else if (chatType.value === 'group' && currentGroup.value) {
    const message = {
      type: 'SendGroupMessage' as const,
      group_id: chatId.value,
      message: newMessage.value
    }
    sendMessage(message)
    friend_msg.value.push({
      sender_id: myidConst.value,
      message: newMessage.value,
      timestamp: new Date().toISOString()
    })
    newMessage.value = ''
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
