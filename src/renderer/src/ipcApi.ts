import { ClientMessage } from 'src/types/WebsocketRequest'
import {
  RegisterRequest,
  LoginRequest,
  FriendRequest,
  PasswordRequest,
  GroupRequest,
  CreateGroupRequest,
  MessageRequest
} from '../../types/HttpRequest'
import { ServerResponse } from 'src/types/HttpRespond'

export {
  ipcHandle,
  ping,
  setBaseUrl,
  register,
  login,
  logout,
  myid,
  friend_add,
  sendMessage,
  password,
  friend_list,
  friend_info,
  group_list,
  group_info,
  group_members,
  group_new,
  group_join,
  group_leave,
  group_messages,
  friend_messages
}
// 自带的ipc测试方法，无用
const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

// 测试方法：进程间通信
const ping = async (): Promise<string> => {
  return await window.api.ping()
}

// 方法：修改后端URL
const setBaseUrl = async (URL: string): Promise<boolean> => {
  return await window.api.setBaseUrl(URL)
}

/// 注册的api
const register = async (RegisterData: RegisterRequest): Promise<ServerResponse> => {
  return await window.api.register(RegisterData)
}

/// 登陆的api
const login = async (LoginData: LoginRequest): Promise<boolean> => {
  return window.api.login(LoginData)
}

/// 注销登陆的api
const logout = async (): Promise<ServerResponse> => {
  return window.api.logout()
}

/// 修改密码的api
const password = async (requestData: PasswordRequest): Promise<ServerResponse> => {
  return window.api.password(requestData)
}

/// 获取登陆user id
const myid = (): number => {
  return window.api.myid()
}

/// 添加好友的api
const friend_add = async (requestData: FriendRequest): Promise<ServerResponse> => {
  return window.api.friend_add(requestData)
}

/// 好友列表的api
const friend_list = async (): Promise<ServerResponse> => {
  return window.api.friend_list()
}

/// 好友信息的api
const friend_info = async (requestData: FriendRequest): Promise<ServerResponse> => {
  return window.api.friend_info(requestData)
}

/// 群组列表的api
const group_list = async (): Promise<ServerResponse> => {
  return window.api.group_list()
}

/// 群组信息的api
const group_info = async (requestData: GroupRequest): Promise<ServerResponse> => {
  return window.api.group_info(requestData)
}

/// 群组成员的api
const group_members = async (requestData: GroupRequest): Promise<ServerResponse> => {
  return window.api.group_members(requestData)
}

/// 创建群组的api
const group_new = async (requestData: CreateGroupRequest): Promise<ServerResponse> => {
  return window.api.group_new(requestData)
}

/// 加入群组的api
const group_join = async (requestData: GroupRequest): Promise<ServerResponse> => {
  return window.api.group_join(requestData)
}

/// 退出群组的api
const group_leave = async (requestData: GroupRequest): Promise<ServerResponse> => {
  return window.api.group_leave(requestData)
}

/// 群组聊天记录的api
const group_messages = async (requestData: MessageRequest): Promise<ServerResponse> => {
  return window.api.group_messages(requestData)
}

/// 好友聊天记录的api
const friend_messages = async (requestData: MessageRequest): Promise<ServerResponse> => {
  return window.api.friend_messages(requestData)
}

/// 发送消息到联系人或群聊的api
const sendMessage = async (message: ClientMessage): Promise<void> => {
  window.api.sendMessage(message)
}
