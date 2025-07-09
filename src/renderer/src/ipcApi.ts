import { ClientMessage } from 'src/types/WebsocketRequest'
import {
  RegisterRequest,
  LoginRequest,
  FriendRequest,
  PasswordRequest,
  GroupRequest,
  CreateGroupRequest,
  UpdateUserRequest,
  PatchUserRequest
} from '../../types/HttpRequest'
import {
  GroupDetailedInfo,
  GroupSimpleInfo,
  UserDetailedInfo,
  UserSimpleInfo,
  UserSimpleInfoWithStatus
} from 'src/types/HttpRespond'
import { Account, Conversation, ApiResponse } from '@apiType/Model'
import { LocalSessionMessage } from '@apiType/Model'
import { avatarStore } from './stores/avatarStore'

export {
  ipcHandle,
  ping,
  getLocalFile,
  getSecureFileUrl,
  setBaseUrl,
  getBaseUrl,
  addOrUpdateAccount,
  getAccounts,
  deleteAccount,
  register,
  login,
  logout,
  myid,
  uploadAvatar,
  updateMe,
  getMe,
  patchMe,
  deleteMe,
  friend_list,
  group_list,
  getFriendsWithStatus,
  getFriendStatus,
  friend_add,
  sendMessage,
  password,
  friend_info,
  group_info,
  group_members,
  group_new,
  group_join,
  group_leave,
  getLocalGroupMessages,
  getLocalPrivateMessages,
  getLocalGroupMessagesAfterTimestamp,
  getLocalPrivateMessagesAfterTimestamp,
  saveMessageToDB,
  getConversations,
  getConversation,
  updateConversationUnread,
  markConversationRead,
  deleteConversation,
  getConversationCount,
  getTotalUnreadCount
}
// 自带的ipc测试方法，无用
const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

// 测试方法：进程间通信
const ping = async (): Promise<ApiResponse<void>> => {
  return await window.api.ping()
}

// 获取文件(并缓存到本地)
const getLocalFile = async (url: string, folder?: string): Promise<ApiResponse<string>> => {
  return await window.api.getLocalFile(url, folder)
}

// 获取文件的安全 URL
const getSecureFileUrl = async (appUrl: string): Promise<ApiResponse<string>> => {
  return await window.api.getSecureFileUrl(appUrl)
}

// 方法：修改后端URL
const setBaseUrl = async (URL: string): Promise<boolean> => {
  return await window.api.setBaseUrl(URL)
}

/// 获取后端URL
const getBaseUrl = async (): Promise<string> => {
  return await window.api.getBaseUrl()
}

/// 插入登录账号到本地数据库
const addOrUpdateAccount = async (Data: Account): Promise<ApiResponse<void>> => {
  return window.api.addOrUpdateAccount(Data)
}

/// 从本地数据库读取登陆账户
const getAccounts = async (): Promise<ApiResponse<Account[]>> => {
  return window.api.getAccounts()
}

/// 从本地数据库删除登录账号
const deleteAccount = async (accountId: number): Promise<ApiResponse<void>> => {
  return window.api.deleteAccount(accountId)
}

/// 注册的api
const register = async (RegisterData: RegisterRequest): Promise<ApiResponse<number>> => {
  return await window.api.register(RegisterData)
}

/// 登陆的api
const login = async (LoginData: LoginRequest): Promise<boolean> => {
  return window.api.login(LoginData)
}

/// 注销登陆的api
const logout = async (): Promise<ApiResponse<void>> => {
  avatarStore.clearCache() // 退出时清空头像和用户信息缓存
  return window.api.logout()
}

/// 修改密码的api
const password = async (requestData: PasswordRequest): Promise<ApiResponse<void>> => {
  return window.api.password(requestData)
}

/// 获取登陆user id
const myid = async (): Promise<number> => {
  return window.api.myid()
}

// 上传头像
const uploadAvatar = async (file: {
  name: string
  type: string
  buffer: ArrayBuffer
}): Promise<ApiResponse<string>> => {
  // 将 ArrayBuffer 转为 Uint8Array 以便序列化传递
  return await window.api.uploadAvatar({
    name: file.name,
    type: file.type,
    buffer: Array.from(new Uint8Array(file.buffer))
  })
}

// 获取当前用户信息
const getMe = async (): Promise<ApiResponse<UserDetailedInfo>> => {
  return await window.api.getMe()
}

// 完整更新个人信息
const updateMe = async (data: UpdateUserRequest): Promise<ApiResponse<void>> => {
  return await window.api.updateMe(data)
}

// 部分更新个人信息
const patchMe = async (data: PatchUserRequest): Promise<ApiResponse<void>> => {
  return await window.api.patchMe(data)
}

// 删除账号
const deleteMe = async (): Promise<ApiResponse<void>> => {
  return await window.api.deleteMe()
}

/// 群组列表的api
const group_list = async (): Promise<ApiResponse<GroupSimpleInfo[]>> => {
  return window.api.group_list()
}

/// 好友列表的api
const friend_list = async (): Promise<ApiResponse<UserSimpleInfoWithStatus[]>> => {
  return window.api.friend_list()
}

/// 获取所有好友及其状态
const getFriendsWithStatus = async (): Promise<
  ApiResponse<Array<UserSimpleInfo & { online: boolean; lastOnlineTime: number }>>
> => {
  return window.api.getFriendsWithStatus()
}

/// 获取指定好友的状态
const getFriendStatus = async (
  userId: number
): Promise<ApiResponse<{ online: boolean; lastOnlineTime: number } | null>> => {
  return window.api.getFriendStatus(userId)
}

/// 添加好友的api
const friend_add = async (requestData: FriendRequest): Promise<ApiResponse<void>> => {
  return window.api.friend_add(requestData)
}

/// 好友信息的api
const friend_info = async (requestData: FriendRequest): Promise<ApiResponse<UserDetailedInfo>> => {
  return window.api.friend_info(requestData)
}

/// 群组信息的api
const group_info = async (requestData: GroupRequest): Promise<ApiResponse<GroupDetailedInfo>> => {
  return window.api.group_info(requestData)
}

/// 群组成员的api
const group_members = async (requestData: GroupRequest): Promise<ApiResponse<UserSimpleInfo[]>> => {
  return window.api.group_members(requestData)
}

/// 创建群组的api
const group_new = async (requestData: CreateGroupRequest): Promise<ApiResponse<number>> => {
  return window.api.group_new(requestData)
}

/// 加入群组的api
const group_join = async (requestData: GroupRequest): Promise<ApiResponse<void>> => {
  return window.api.group_join(requestData)
}

/// 退出群组的api
const group_leave = async (requestData: GroupRequest): Promise<ApiResponse<void>> => {
  return window.api.group_leave(requestData)
}

/// 本地群聊聊天记录（分页）
const getLocalGroupMessages = async (
  groupId: number,
  offset: number,
  limit: number
): Promise<LocalSessionMessage[]> => {
  return window.api.getLocalGroupMessages(groupId, offset, limit)
}

/// 本地私聊聊天记录（分页）
const getLocalPrivateMessages = async (
  userId: number,
  offset: number,
  limit: number
): Promise<LocalSessionMessage[]> => {
  return window.api.getLocalPrivateMessages(userId, offset, limit)
}

/// 本地群聊某时间戳后的消息
const getLocalGroupMessagesAfterTimestamp = async (
  groupId: number,
  after: number
): Promise<LocalSessionMessage[]> => {
  return window.api.getLocalGroupMessagesAfterTimestamp(groupId, after)
}

/// 本地私聊某时间戳后的消息
const getLocalPrivateMessagesAfterTimestamp = async (
  userId: number,
  after: number
): Promise<LocalSessionMessage[]> => {
  return window.api.getLocalPrivateMessagesAfterTimestamp(userId, after)
}

/// 写入本地消息
const saveMessageToDB = async (params: {
  type: 'private' | 'group'
  receiver_id?: number
  group_id?: number
  message: string
  sender_id: number
  timestamp: number
  message_id?: number
}): Promise<boolean> => {
  return window.api.saveMessageToDB(params)
}

/// 发送消息到联系人或群聊的api
const sendMessage = async (message: ClientMessage): Promise<boolean> => {
  return window.api.sendMessage(message)
}

// 会话相关接口

/// 获取会话列表
const getConversations = async (): Promise<ApiResponse<Conversation[]>> => {
  return window.api.getConversations()
}

/// 获取指定会话信息
const getConversation = async (
  conversationType: string,
  targetId: number
): Promise<ApiResponse<Conversation | null>> => {
  return window.api.getConversation(conversationType, targetId)
}

/// 更新会话未读消息数
const updateConversationUnread = async (
  conversationType: string,
  targetId: number,
  unreadCount: number
): Promise<ApiResponse<boolean>> => {
  return window.api.updateConversationUnread(conversationType, targetId, unreadCount)
}

/// 标记会话为已读
const markConversationRead = async (
  conversationType: string,
  targetId: number
): Promise<ApiResponse<boolean>> => {
  return window.api.markConversationRead(conversationType, targetId)
}

/// 删除会话
const deleteConversation = async (
  conversationType: string,
  targetId: number
): Promise<ApiResponse<boolean>> => {
  return window.api.deleteConversation(conversationType, targetId)
}

/// 获取会话总数
const getConversationCount = async (): Promise<ApiResponse<number>> => {
  return window.api.getConversationCount()
}

/// 获取总未读消息数
const getTotalUnreadCount = async (): Promise<ApiResponse<number>> => {
  return window.api.getTotalUnreadCount()
}
