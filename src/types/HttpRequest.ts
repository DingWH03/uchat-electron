// HttpRequest.ts

// 注册请求
export interface RegisterRequest {
  username: string
  password: string
}

// 修改密码请求
export interface PasswordRequest {
  user_id: number
  old_password: string
  new_password: string
}

// 登录请求
export interface LoginRequest {
  userid: number
  password: string
}

// 好友请求结构体
export interface FriendRequest {
  id: number
}

// 群聊请求结构体
export interface GroupRequest {
  id: number
}

// 创建群组请求
export interface CreateGroupRequest {
  group_name: string
  members: number[] // 成员ID列表
}

// 获取聊天记录请求
// offset如果是0，则返回最近的30条，如果是1，则返回31-60条，依次类推
export interface MessageRequest {
  id: number // 用户ID或群组ID
  offset: number
}

export interface AfterTimestampQuery {
  id: number
  after: number
}

export interface PatchUserRequest {
  username: string | null
}

export interface UpdateUserRequest {
  username: string
}
