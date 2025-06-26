import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  RegisterRequest,
  LoginRequest,
  FriendRequest,
  PasswordRequest,
  GroupRequest,
  CreateGroupRequest,
  MessageRequest
} from '../types/HttpRequest'
import { Account } from '../types/localDBModel'

// Custom APIs for renderer
const api = {
  // Http: 测试ping
  ping: async () => {
    return await ipcRenderer.invoke('api:ping')
  },
  // 修改后端url
  setBaseUrl: async (URL: string) => {
    return await ipcRenderer.invoke('api:setBaseUrl', URL)
  },
  // 获取后端url
  getBaseUrl: async () => {
    return await ipcRenderer.invoke('api:getBaseUrl')
  },
  // Http: 注册账号
  register: async (registerData: RegisterRequest) => {
    return await ipcRenderer.invoke('api:auth/register', registerData)
  },
  // Http: 登录账号，然后注册到websocket
  login: async (loginData: LoginRequest) => {
    return await ipcRenderer.invoke('api:auth/login', loginData)
  },
  // Http: 注销账号
  logout: async () => {
    return await ipcRenderer.invoke('api:auth/logout')
  },
  // Http: 修改密码
  password: async (requestData: PasswordRequest) => {
    return await ipcRenderer.invoke('api:auth/password', requestData)
  },
  // 获取登陆用户的id
  myid: () => {
    return ipcRenderer.invoke('api:auth/myid')
  },
  // Http: 添加好友
  friend_add: async (requestData: FriendRequest) => {
    return await ipcRenderer.invoke('api:friend/add', requestData)
  },
  // Http: 好友列表
  friend_list: async () => {
    return await ipcRenderer.invoke('api:friend/list')
  },
  // Http: 好友列表 v2
  friend_list_v2: async () => {
    return await ipcRenderer.invoke('api:friend/listv2')
  },
  // Http: 好友信息
  friend_info: async (requestData: FriendRequest) => {
    return await ipcRenderer.invoke('api:friend/info', requestData)
  },
  // Http: 群组列表
  group_list: async () => {
    return await ipcRenderer.invoke('api:group/list')
  },
  // Http: 群组信息
  group_info: async (requestData: GroupRequest) => {
    return await ipcRenderer.invoke('api:group/info', requestData)
  },
  // Http: 群组成员
  group_members: async (requestData: GroupRequest) => {
    return await ipcRenderer.invoke('api:group/members', requestData)
  },
  // Http: 新建群组
  group_new: async (requestData: CreateGroupRequest) => {
    return await ipcRenderer.invoke('api:group/new', requestData)
  },
  // Http: 加入群组
  group_join: async (requestData: GroupRequest) => {
    return await ipcRenderer.invoke('api:group/join', requestData)
  },
  // Http: 退出群组
  group_leave: async (requestData: GroupRequest) => {
    return await ipcRenderer.invoke('api:group/leave', requestData)
  },
  // Http: 获取群组消息
  group_messages: async (requestData: MessageRequest) => {
    return await ipcRenderer.invoke('api:message/group', requestData)
  },
  // Http: 获取私聊消息
  friend_messages: async (requestData: MessageRequest) => {
    return await ipcRenderer.invoke('api:message/user', requestData)
  },
  // WebSocket：发送消息
  sendMessage: async (msg: string) => {
    await ipcRenderer.invoke('ws:send', msg)
  },
  // WebSocket：监听连接状态
  onWSStatus: (callback: (status: string) => void) => {
    ipcRenderer.on('ws:status', (_, status) => callback(status))
  },
  // WebSocket：监听主进程推送的消息
  onWSMessage: (callback: (msg: string) => void) => {
    ipcRenderer.on('ws:message', (_, msg) => callback(msg))
  }
}

const localDB = {
  // 添加登陆账户
  addOrUpdateAccount: async (Data: Account) => {
    return await ipcRenderer.invoke('localdb:addOrUpdateAccount', Data)
  },
  getAccounts: async () => {
    return await ipcRenderer.invoke('localdb:getAccounts')
  },
  deleteAccount: async (accountId: number) => {
    return await ipcRenderer.invoke('localdb:deleteAccount', accountId)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('localDB', localDB)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.localDB = localDB
}
