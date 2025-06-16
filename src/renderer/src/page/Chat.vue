<template>
  <div id="container">
    <div id="left">
      <div id="lefttop" class="button-row">
        <button class="top-action-btn" @click="gosearch">添加好友</button>
        <button class="top-action-btn" @click="f5">刷新</button>
        <button class="top-action-btn" @click="cg">创建群组</button>
      </div>
      <div id="friendlist">
        <div class="list-title">好友列表</div>
        <div
          v-for="(item, index) in friendList"
          :key="item.base.user_id"
          :class="['friendname', item.online == true ? 'online' : 'notonline']"
          @click="friendChat(index)"
        >
          <span class="icon">👤</span> {{ item.base.username }}
        </div>
      </div>
      <div id="grouplist">
        <div class="list-title">群组列表</div>
        <div
          v-for="(item, index) in groupList"
          :key="item.group_id"
          class="groupname"
          @click="groupChat(index)"
        >
          <span class="icon">👥</span>{{ item.title }}
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
          <div class="msgid">{{ msg.sender_id }}</div>
          <div class="content">{{ msg.message }}</div>
        </div>
      </div>
      <div id="rightbottom">
        <input v-model="newMessage" placeholder="请输入你的消息…" @keyup.enter="send_message" />
        <button @click="send_message">发送</button>
      </div>
    </div>
  </div>

  <div id="back-container">
    <button class="square-btn" @click="back">返回登录</button>
  </div>
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
  group_messages
} from '../ipcApi'
// import { LoginRequest } from 'src/types/HttpRequest'
// import { ClientMessage } from 'src/types/WebsocketRequest'
import { useRouter } from 'vue-router'
import { GroupSimpleInfo, ServerResponse } from '@apiType/HttpRespond'
import { UserSimpleInfoWithStatus, MessagesResponse } from '@apiType/HttpRespond'
import { MessageRequest } from '@apiType/HttpRequest'
import { ClientMessage } from '@apiType/WebsocketRequest'
import { onMounted } from 'vue'
import { showNotification } from '@renderer/utils/notification'

let myidConst: number = 0

onMounted(async () => {
  showNotification('登录成功', '欢迎回来！', '')
  myidConst = await myid()
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
      if (msg.sender == friend_id && isgroup == false) {
        friend_msg.value.push({
          sender_id: friend_id,
          message: msg.message,
          timestamp: new Date().toISOString()
        })
      } else {
        showNotification(`来自 ${msg.sender} 的新消息`, ` ${msg.message} `, '')
      }
    } else if (msg.type == 'SendGroupMessage' && isgroup == true) {
      if (msg.sender == group_id) {
        friend_msg.value.push({
          sender_id: friend_id,
          message: msg.message,
          timestamp: new Date().toISOString()
        })
      } else {
        showNotification(`来自群 ${msg.group_id} 的新消息`, ` ${msg.group_id}：${msg.message} `, '')
      }
    } else if (msg.type == 'OnlineMessage') {
      showNotification('你的好友上线了', `你的好友 ${msg.friend_id} 上线了，快去和他聊两句吧`, '')
      console.log(msg.friend_id, '上线了')
      f5()
    } else if (msg.type == 'OfflineMessage') {
      showNotification('你的好友下线了', `你的好友 ${msg.friend_id} 已暂时下线`, '')
      console.log(msg.friend_id, '下线了')
      f5()
    }
  })
})
const router = useRouter()
// const username = ref('')
// const password = ref('')
// const showSettings = ref(false)

const friendList = ref<UserSimpleInfoWithStatus[]>([])
const groupList = ref<GroupSimpleInfo[]>([])
let friend_id: number = myidConst
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

const cg = (): void => {
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
  else if (isgroup == true) {
    const message: ClientMessage = {
      type: 'SendGroupMessage',
      group_id: group_id,
      message: newMessage.value
    }
    sendMessage(message)
  }
  friend_msg.value.push({
    sender_id: myidConst,
    message: newMessage.value,
    timestamp: new Date().toISOString()
  })
  newMessage.value = ''
}
</script>
<style>
#container {
  width: 100vw;
  height: 90vh;
  display: flex;
  background: linear-gradient(135deg, #a1c4fd, #c2e9fb);
  font-family: 'Segoe UI', sans-serif;
  position: relative;
}

#left {
  width: 30vw;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

#lefttop {
  display: flex;
  height: 10%;
  background-color: rgba(240, 240, 240, 0.3);
  border-bottom: 1px solid #ccc;
}

#lefttop button {
  padding: 6px 12px;
  border: none;
  background-color: #007aff;
  color: white;
  border-radius: 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

#lefttop button:hover {
  background-color: #005bb5;
}

#friendlist,
#grouplist {
  height: 45%;
  overflow-y: auto;
  padding: 0 10px;
  background-color: rgba(255, 255, 255, 0.95); /* ✅ 更加不透明 */
  border-bottom: 1px solid #ddd;
  position: relative;
  border-radius: 8px;
  margin: 8px;
}

.list-title {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: rgba(255, 255, 255, 1);
  font-size: 16px;
  font-weight: bold;
  color: #333;
  padding: 8px 0;
  border-bottom: 1px solid #ccc;
}

.friendname,
.groupname {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background-color: #ffffff;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.friendname:hover,
.groupname:hover {
  background-color: #f0f8ff;
}

/* 小图标样式 */
.icon {
  font-size: 18px;
}

.online {
  color: #28a745;
  font-weight: bold;
}

.notonline {
  color: #555;
}

#right {
  width: 70vw;
  display: flex;
  flex-direction: column;
}

#righttop {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #ccc;
  scroll-behavior: smooth;
}



.msgid {
  position: absolute;
  top: -18px;
  font-size: 12px;
  color: gray;
}

.mine .msgid {
  right: 0;
  text-align: right;
}

.theirs .msgid {
  left: 0;
  text-align: left;
}
.content{
  background-color: #1890ff;
  max-width: 100%;
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
#rightbottom {
  display: flex;
  align-items: center;
  padding: 14px;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

#rightbottom input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #ccc;
  border-radius: 20px;
  font-size: 14px;
  margin-right: 12px;
  outline: none;
  background-color: #fff;
}

#rightbottom button {
  padding: 8px 16px;
  border: none;
  background-color: #007aff;
  color: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

#rightbottom button:hover {
  background-color: #005bb5;
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.left-btn {
  padding: 6px 12px;
  margin: 0 6px;
  background-color: #007aff;
  color: #fff;
  border: none;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.left-btn:hover {
  background-color: #005bb5;
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

#rightbottom input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 1; /* 去除圆角 */
  background: #ffffff;
  margin-right: 10px;
  outline: none;
  font-size: 14px;
}

.message {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 0; /* 去除圆角 */
  position: relative;
}

.theirs {
  align-self: flex-start;
  color: white;
}

.mine {
  align-self: flex-end;
  color: white;
}

#back-container {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
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

.button-row {
  display: flex;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.3); /* 同容器背景 */
}

.top-action-btn {
  flex: 1;
  height: 100%;
  border: none;
  border-radius: 0 !important; /* ✅ 保证去掉圆角 */
  background-color: transparent;
  box-shadow: none;
  outline: none;
  margin: 0;
  padding: 0;
  font-size: 16px;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
}

/* 添加按钮之间的分隔线 */
.top-action-btn:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  width: 1px;
  height: 60%;
  background-color: #666; /* 可调分割线颜色 */
}

/* 悬停时轻微高亮反馈，可选 */
.top-action-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
