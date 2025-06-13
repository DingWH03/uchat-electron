// HttpRespond.ts

// 通用结构体定义
export type SessionMessage = {
  sender_id: number
  message: string
  timestamp: string // ISO 格式字符串
}

export type UserSimpleInfo = {
  user_id: number
  username: string
}

export type UserSimpleInfoWithStatus = {
  user_id: number
  username: string
  online: boolean
}

export type GroupSimpleInfo = {
  title: number
  group_name: string
}

export type UserDetailedInfo = {
  user_id: number
  username: string
}

export type GroupDetailedInfo = {
  group_id: number
  group_name: string
}

// === 对应 Rust 枚举每一个变体 ===

// 通用响应
export type GenericResponse = {
  action: 'generic_response'
  status: string
  message: string
}

// 登录响应
export type LoginResponse = {
  action: 'login_response'
  status: boolean
  message: string
}

// 注册响应
export type RegisterResponse = {
  action: 'register_response'
  status: boolean
  message: string
}

// 接收群聊消息
export type ReceiveMessage = {
  action: 'receive_message'
  group_id: number
  sender: number
  message: string
  timestamp: string
}

// 错误响应
export type ErrorResponse = {
  action: 'error'
  message: string
}

// 在线用户列表
export type OnlineUsers = {
  action: 'online_users'
  flag: string
  user_ids: number[]
}

// 用户详细信息
export type UserInfoResponse = {
  action: 'userinfo'
  user_id: number
  userinfo: UserDetailedInfo
}

// 群组详细信息
export type GroupInfoResponse = {
  action: 'groupinfo'
  group_id: number
  groupinfo: GroupDetailedInfo
}

// 群组成员
export type GroupMembersResponse = {
  action: 'group_members'
  group_id: number
  member_ids: UserSimpleInfo[]
}

// 好友列表
export type FriendListResponse = {
  action: 'friend_list'
  friends: UserSimpleInfo[]
}

// 好友列表v2
export type FriendListResponseV2 = {
  action: 'friend_list_with_status'
  friends: UserSimpleInfoWithStatus[]
}

// 群列表
export type GroupListResponse = {
  action: 'group_list'
  groups: GroupSimpleInfo[]
}

// 私聊消息
export type MessagesResponse = {
  action: 'messages'
  friend_id: number
  messages: SessionMessage[]
}

// 群聊消息
export type GroupMessagesResponse = {
  action: 'groupmessages'
  group_id: number
  messages: SessionMessage[]
}

// === 联合类型 ===

export type ServerResponse =
  | GenericResponse
  | LoginResponse
  | RegisterResponse
  | ReceiveMessage
  | ErrorResponse
  | OnlineUsers
  | UserInfoResponse
  | GroupInfoResponse
  | GroupMembersResponse
  | FriendListResponse
  | FriendListResponseV2
  | GroupListResponse
  | MessagesResponse
  | GroupMessagesResponse
