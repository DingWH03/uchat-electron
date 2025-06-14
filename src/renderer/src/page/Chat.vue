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
          :key="item.base.user_id"
          :class="['friendname', item.online == true ? 'online' : 'notonline']"
          @click="friendChat(index)"
        >
          {{ item.base.username }}
        </div>
      </div>
      <div id="grouplist">
        <div
          v-for="(item, index) in groupList"
          :key="item.group_id"
          class="groupname"
          @click="groupChat(index)"
        >
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
  friend_list_v2,
  friend_messages,
  sendMessage,
  myid,
  group_list,
  group_new,
  group_messages
} from '../ipcApi'
// import { LoginRequest } from 'src/types/HttpRequest'
// import { ClientMessage } from 'src/types/WebsocketRequest'
import { useRouter } from 'vue-router'
import { GroupSimpleInfo, ServerResponse } from '@apiType/HttpRespond'
import { UserSimpleInfoWithStatus, MessagesResponse } from '@apiType/HttpRespond'
import { CreateGroupRequest, MessageRequest } from '@apiType/HttpRequest'
import { ClientMessage } from '@apiType/WebsocketRequest'
import { onMounted } from 'vue'

onMounted(async () => {
  try {
    const list: ServerResponse = await friend_list_v2()
    if (list.action === 'friend_list_with_status') {
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

const friendList = ref<UserSimpleInfoWithStatus[]>([])
const groupList = ref<GroupSimpleInfo[]>([])
let friend_id: number = myid()
let group_id: number = 0
let friend_msg = ref<MessagesResponse['messages']>([])
const newMessage = ref('')
let isgroup: boolean = false

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const f5 = async () => {
  const flist: ServerResponse = await friend_list_v2()
  if (flist.action === 'friend_list_with_status') {
    friendList.value = flist.friends
    console.log(friendList.value)
    // console.log(friendList)
  }
  const glist: ServerResponse = await group_list()
  if (glist.action === 'group_list') {
    groupList.value = glist.groups
    // console.log(groupList.value)
  }
}


const cg=()=>{
  router.push('/create')
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const friendChat = async (index) => {
  console.log('你点击了第', index, '个好友')
  // 你可以这样获取到对应的数据：
  friend_id = friendList.value[index].base.user_id
  console.log('具体好友信息为', friend_id)
  const request: MessageRequest = {
    id: friendList.value[index].base.user_id, // 用户ID或群组ID
    offset: 0
  }
  const result = await friend_messages(request)
  if (result.action == 'messages') {
    friend_msg.value = result.messages
    console.log(friend_msg)
  }
  isgroup = false
}
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const groupChat = async (index) => {
  console.log('点击了第', index, '个群聊')
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  ;(group_id = groupList.value[index].group_id), console.log('群组id为', group_id)
  const request: MessageRequest = {
    id: groupList.value[index].group_id, // 用户ID或群组ID
    offset: 0
  }
  console.log(request)
  const result = await group_messages(request)
  console.log(result)
  if (result.action == 'messages') {
    friend_msg.value = result.messages
    console.log(friend_msg)
  }
  isgroup = true
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
  if (isgroup == false) {
    const message: ClientMessage = {
      type: 'SendMessage',
      receiver: friend_id,
      message: newMessage.value
    }
    sendMessage(message)
  }
  if (isgroup == true) {
    const message: ClientMessage = {
      type: 'SendGroupMessage',
      group_id: group_id,
      message: newMessage.value
    }
    sendMessage(message)
  }
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
