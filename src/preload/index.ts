import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  RegisterRequest,
  LoginRequest,
  FriendRequest,
  PasswordRequest,
  GroupRequest,
  CreateGroupRequest,
  MessageRequest,
  PatchUserRequest,
  UpdateUserRequest
} from '../types/HttpRequest'
import { Account } from '../types/Model'
import { ServerMessage } from '../types/WebsocketRespond'

// Custom APIs for renderer
const api = {
  // Http: 测试ping
  ping: async () => {
    return await ipcRenderer.invoke('api:ping')
  },
  // 获取文件，缓存到本地
  getLocalFile: async (url: string, folder?: string) => {
    return await ipcRenderer.invoke('api:file/get-local-file', url, folder)
  },
  // 获取文件的安全 URL
  getSecureFileUrl: async (appUrl: string) => {
    return await ipcRenderer.invoke('api:file/get-secure-url', appUrl)
  },
  // 修改后端url
  setBaseUrl: async (URL: string) => {
    return await ipcRenderer.invoke('config:setBaseUrl', URL)
  },
  // 获取后端url
  getBaseUrl: async () => {
    return await ipcRenderer.invoke('config:getBaseUrl')
  },
  // 添加登陆账户
  addOrUpdateAccount: async (Data: Account) => {
    return await ipcRenderer.invoke('api:account/addOrUpdateAccount', Data)
  },
  getAccounts: async () => {
    return await ipcRenderer.invoke('api:account/getAccounts')
  },
  deleteAccount: async (accountId: number) => {
    return await ipcRenderer.invoke('api:account/deleteAccount', accountId)
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
    return ipcRenderer.invoke('config:myid')
  },
  // 1. 上传头像（file: File）→ 返回 ApiResponse<string>
  uploadAvatar: async (file: { name: string; type: string; buffer: number[] }) => {
    return await ipcRenderer.invoke('api:user/upload-avatar', file)
  },
  // 2. 获取当前用户信息 → ApiResponse<UserDetailedInfo>
  getMe: async () => {
    return await ipcRenderer.invoke('api:user/get-me')
  },
  // 3. 完整更新个人信息（PUT）→ ApiResponse<void>
  updateMe: async (data: UpdateUserRequest) => {
    return await ipcRenderer.invoke('api:user/update-me', data)
  },
  // 4. 部分更新个人信息（PATCH）→ ApiResponse<void>
  patchMe: async (data: PatchUserRequest) => {
    return await ipcRenderer.invoke('api:user/patch-me', data)
  },
  // 5. 删除当前用户账号 → ApiResponse<void>
  deleteMe: async () => {
    return await ipcRenderer.invoke('api:user/delete-me')
  },
  // Http: 添加好友
  friend_add: async (requestData: FriendRequest) => {
    return await ipcRenderer.invoke('api:friend/add', requestData)
  },
  friend_list: async () => {
    return await ipcRenderer.invoke('api:friend/list')
  },
  group_list: async () => {
    return await ipcRenderer.invoke('api:group/list')
  },
  getFriendsWithStatus: async () => {
    return await ipcRenderer.invoke('api:friends:with-status')
  },
  getFriendStatus: async (userId: number) => {
    return await ipcRenderer.invoke('api:friend:status', userId)
  },
  // // Http: 好友列表
  // friend_list: async () => {
  //   return await ipcRenderer.invoke('api:friend/list')
  // },
  // // Http: 好友列表 v2
  // friend_list_v2: async () => {
  //   return await ipcRenderer.invoke('api:friend/listv2')
  // },
  // Http: 好友信息
  friend_info: async (requestData: FriendRequest) => {
    return await ipcRenderer.invoke('api:friend/info', requestData)
  },
  // // Http: 群组列表
  // group_list: async () => {
  //   return await ipcRenderer.invoke('api:group/list')
  // },
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
  // 新增：本地群聊聊天记录（分页）
  getLocalGroupMessages: async (groupId: number, offset: number, limit: number) => {
    return await ipcRenderer.invoke('api:message/group', groupId, offset, limit)
  },
  // 新增：本地私聊聊天记录（分页）
  getLocalPrivateMessages: async (userId: number, offset: number, limit: number) => {
    return await ipcRenderer.invoke('api:message/user', userId, offset, limit)
  },
  // 新增：本地群聊某时间戳后的消息
  getLocalGroupMessagesAfterTimestamp: async (groupId: number, after: number) => {
    return await ipcRenderer.invoke('api:message/group/after', groupId, after)
  },
  // 新增：本地私聊某时间戳后的消息
  getLocalPrivateMessagesAfterTimestamp: async (userId: number, after: number) => {
    return await ipcRenderer.invoke('api:message/user/after', userId, after)
  },
  // 新增：写入本地消息
  saveMessageToDB: async (params: {
    type: 'private' | 'group'
    receiver_id?: number
    group_id?: number
    message: string
    sender_id: number
    timestamp: number
    message_id?: number
  }) => {
    return await ipcRenderer.invoke('api:saveMessageToDB', params)
  },
  // 会话相关接口
  getConversations: async () => {
    return await ipcRenderer.invoke('api:conversation/get-conversations')
  },
  getConversation: async (conversationType: string, targetId: number) => {
    return await ipcRenderer.invoke('api:conversation/get-conversation', conversationType, targetId)
  },
  updateConversationUnread: async (
    conversationType: string,
    targetId: number,
    unreadCount: number
  ) => {
    return await ipcRenderer.invoke(
      'api:conversation/update-conversation-unread',
      conversationType,
      targetId,
      unreadCount
    )
  },
  markConversationRead: async (conversationType: string, targetId: number) => {
    return await ipcRenderer.invoke(
      'api:conversation/mark-conversation-read',
      conversationType,
      targetId
    )
  },
  deleteConversation: async (conversationType: string, targetId: number) => {
    return await ipcRenderer.invoke(
      'api:conversation/delete-conversation',
      conversationType,
      targetId
    )
  },
  getConversationCount: async () => {
    return await ipcRenderer.invoke('api:conversation/get-conversation-count')
  },
  getTotalUnreadCount: async () => {
    return await ipcRenderer.invoke('api:conversation/get-total-unread-count')
  },
  // WebSocket: 发送消息
  sendMessage: async (message: MessageRequest) => {
    return await ipcRenderer.invoke('ws:send', message)
  },
  // WebSocket: 监听消息
  onWSMessage: (callback: (message: ServerMessage) => void) => {
    ipcRenderer.on('ws:message', (_, message) => callback(message))
  },
  // WebSocket：监听连接状态
  onWSStatus: (callback: (status: string) => void) => {
    ipcRenderer.on('ws:status', (_, status) => callback(status))
  },
  // 好友上线监听
  onFriendOnline: (callback: (data: { user_id: number }) => void) => {
    ipcRenderer.on('friend:online', (_, data) => callback(data))
  },
  // 好友下线监听
  onFriendOffline: (callback: (data: { user_id: number }) => void) => {
    ipcRenderer.on('friend:offline', (_, data) => callback(data))
  },
  // 好友状态批量更新监听
  onFriendStatusUpdated: (
    callback: (data: Array<{ user_id: number; online: boolean }>) => void
  ) => {
    ipcRenderer.on('friend:status-updated', (_, data) => callback(data))
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
