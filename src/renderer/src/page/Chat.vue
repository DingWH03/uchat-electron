<template>
  <div id="container">
    <div id="left">
      <div id="lefttop">
        <button id="search" @click="gosearch">加</button>
        <button id="f5" @click="f5">f5</button>
        <button id="createg" @click="cg">建群</button>
      </div>
      <div id="friendlist">
        <div
          v-for="(item, index) in friendList"
          :key="item.user_id"
          class="friendname"
          @click="friendChat(index)"
        >
          {{ item.username }}
        </div>
      </div>
      <div id="grouplist">
        <div v-for="(item, index) in groupList" :key="item.group_id" class="groupname">
          {{ item.title }}
        </div>
      </div>
    </div>
    <div id="right">
      <div id="righttop">
        <div
          v-for="msg in friend_msg"
          :key="msg.timestamp"
          :class="['message', msg.sender_id == friend_id ? 'theirs' : 'mine']"
        >
          <div class="content">{{ msg.message }}</div>
        </div>
      </div>
      <div id="rightbottom">
        <input v-model="newMessage" placeholder="请输入你的消息…" @keyup.enter="send_message" />
        <button @click="send_message">发送</button>
      </div>
    </div>
  </div>

  <div><button @click="back">back</button></div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
// import SettingsDialog from '../components/SettingsDialog.vue'
import {
  logout,
  friend_list,
  friend_messages,
  sendMessage,
  myid,
  group_list,
  group_new
} from '../ipcApi'
// import { LoginRequest } from 'src/types/HttpRequest'
// import { ClientMessage } from 'src/types/WebsocketRequest'
import { useRouter } from 'vue-router'
import { GroupSimpleInfo, ServerResponse } from '@apiType/HttpRespond'
import { UserSimpleInfo, MessagesResponse } from '@apiType/HttpRespond'
import { CreateGroupRequest, MessageRequest } from '@apiType/HttpRequest'
import { ClientMessage } from '@apiType/WebsocketRequest'
import { onMounted } from 'vue'

onMounted(async () => {
  try {
    const list: ServerResponse = await friend_list()
    if (list.action === 'friend_list') {
      friendList.value = list.friends
    }
    const glist: ServerResponse = await group_list()
    if (glist.action === 'group_list') {
      groupList.value = glist.groups
    }
  } catch (error) {
    console.error('加载好友列表失败:', error)
  }
})
onMounted(() => {
  console.log('[App.vue] 注册 WebSocket 监听')

  window.api.onWSStatus((status) => {
    console.log('[UI] WebSocket 状态变化:', status)
  })

  window.api.onWSMessage((msg) => {
    if (msg.type == 'SendMessage') {
      if (msg.sender == friend_id) {
        friend_msg.value.push({
          sender_id: friend_id,
          message: msg.message,
          timestamp: new Date().toISOString()
        })
      }
    }
  })
})
const router = useRouter()
// const username = ref('')
// const password = ref('')
// const showSettings = ref(false)

const friendList = ref<UserSimpleInfo[]>([])
const groupList = ref<GroupSimpleInfo[]>([])
let friend_id: number = myid()
let friend_msg = ref<MessagesResponse['messages']>([])
const newMessage = ref('')

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const f5 = async () => {
  const flist: ServerResponse = await friend_list()
  if (flist.action === 'friend_list') {
    friendList.value = flist.friends
    // console.log(friendList.value)
    // console.log(friendList)
  }
  const glist: ServerResponse = await group_list()
  if (glist.action === 'group_list') {
    groupList.value = glist.groups
    console.log(groupList.value)
  }
}
const cg = async (): Promise<void> => {
  const request: CreateGroupRequest = {
    group_name: '12',
    members: [6, 1, 2]
  }
  const result = await group_new(request)
  if (result.action == 'generic_response') {
    console.log(result.message)
  }
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const friendChat = async (index) => {
  console.log('你点击了第', index, '个好友')
  // 你可以这样获取到对应的数据：
  friend_id = friendList.value[index].user_id
  console.log('具体好友信息为', friend_id)
  const request: MessageRequest = {
    id: friendList.value[index].user_id, // 用户ID或群组ID
    offset: 0
  }
  const result = await friend_messages(request)
  if (result.action == 'messages') {
    friend_msg.value = result.messages
    console.log(friend_msg)
  }
}
const back = (): void => {
  router.push('/login')
  logout()
}
const gosearch = (): void => {
  router.push('/search')
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const send_message = () => {
  const message: ClientMessage = {
    type: 'SendMessage',
    receiver: friend_id,
    message: newMessage.value
  }
  sendMessage(message)
  friend_msg.value.push({
    sender_id: myid(),
    message: newMessage.value,
    timestamp: new Date().toISOString()
  })
  newMessage.value = ''
}
</script>
<style>
@import url('../assets/chat.css');
</style>
