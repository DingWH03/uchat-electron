// HttpRespond.ts

import { ApiResponse, RoleType } from './Model'

export class RequestResponse<T> {
  constructor(
    public status: boolean,
    public code: number,
    public message: string,
    public data?: T
  ) {}

  /**
   * 是否成功（等价于 HTTP 2xx 且 status 为 true）
   */
  isSuccess(): boolean {
    return this.status && this.code >= 200 && this.code < 300
  }

  /**
   * 成功时返回数据，失败时抛出异常
   */
  getDataOrThrow(): T {
    if (!this.isSuccess() || this.data === undefined) {
      throw new Error(`请求失败：${this.message}（状态码：${this.code}）`)
    }
    return this.data
  }

  /**
   * 转换为前端可识别的 ApiResponse 结构（用于 IPC 通信）
   */
  toApiResponse(): ApiResponse<T> {
    return this.isSuccess() && this.data !== undefined
      ? { success: true, data: this.data }
      : { success: false, error: this.message }
  }

  /**
   * 工厂方法：从原始对象构建类实例
   */
  static from<U>(raw: {
    status: boolean
    code: number
    message: string
    data?: U
  }): RequestResponse<U> {
    return new RequestResponse<U>(raw.status, raw.code, raw.message, raw.data)
  }
}

// Enum for MessageType
export enum MessageType {
  Text = 'text',
  Image = 'image',
  File = 'file',
  Video = 'video',
  Audio = 'audio'
}

// Type for SessionMessage
export type SessionMessage = {
  message_id: number // 消息ID
  message_type: MessageType // enum 类型更安全
  sender_id: number
  message: string
  timestamp: number // ISO 格式字符串
}

// Type for GroupSessionMessage
export type GroupSessionMessage = {
  message_id: number // 消息ID
  message_type: MessageType // enum 类型更安全
  group_id: number
  sender_id: number
  timestamp: number // ISO 格式字符串
  message: string
}

export type UserSimpleInfo = {
  user_id: number
  username: string
  avatar_url: string | null // 头像URL，可能为null
}

export type UserSimpleInfoWithStatus = {
  base: UserSimpleInfo
  online: boolean
}

export type GroupSimpleInfo = {
  group_id: number
  title: string
  description: string | null // 群组描述，可能为null
  avatar_url: string | null // 群组头像URL，可能为null
}

export type UserDetailedInfo = {
  user_id: number
  username: string
  role: RoleType
}

export type GroupDetailedInfo = {
  group_id: number
  group_name: string
}

/// 好友与群组更新时间戳
export type UpdateTimestamps = {
  friends_updated_at: number // 好友列表更新时间戳
  groups_updated_at: number // 群组列表更新时间戳
}

/// 好友和群组共同返回值，用于存入数据库
export type ContactList = {
  friends: UserSimpleInfo[] // 好友列表
  groups: GroupSimpleInfo[] // 群组列表
}

export interface IdMessagePair {
  id: number
  message: SessionMessage
}
