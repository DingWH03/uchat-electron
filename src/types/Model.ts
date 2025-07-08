export enum RoleType {
  User = 'user',
  Admin = 'admin',
  Invalid = 'invalid'
}

export type UserStatus = {
  user_id: number
  online: boolean
}

export type chatInfo = {
  id: number | null
  type: 'group' | 'user' | null
}

// 本地数据库返回的消息结构
export interface LocalSessionMessage {
  sender_id: number
  message_type: string
  content: string
  timestamp: number
}

export interface Account {
  id: number
  username: string
  password: string
}

export interface Friend {
  id: number
  username: string
  avatar?: string | null
}

export interface Group {
  id: number
  name: string
  description?: string | null
  avatar?: string | null
}

export interface Message {
  id: number
  message_id: number
  sender_id: number
  receiver_id?: number | null
  group_id?: number | null
  message_type: string
  content: string
  timestamp: number
}

/**
 * 会话类型枚举
 */
export enum ConversationType {
  FRIEND = 'friend',
  GROUP = 'group'
}

/**
 * 会话接口
 */
export interface Conversation {
  account_id: number
  conversation_type: ConversationType
  target_id: number // 好友ID或群组ID
  target_name: string // 好友用户名或群组名称
  target_avatar?: string | null
  last_message_content: string
  last_message_timestamp: number
  unread_count: number
  updated_at: number
}

/**
 * 通用接口返回错误类型
 */
export interface ErrorResult {
  success: false
  error: string
}

/**
 * 通用接口返回成功类型（泛型返回数据）
 */
export interface SuccessResult<T> {
  success: true
  data: T
}

/**
 * IPC 或接口调用通用返回类型
 */
export type ApiResponse<T> = SuccessResult<T> | ErrorResult
