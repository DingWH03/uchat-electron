// types/localDBModel.ts

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
  sender_id: number
  receiver_id?: number | null
  group_id?: number | null
  message_type: string
  content: string
  timestamp: number
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
export type DBResult<T> = SuccessResult<T> | ErrorResult
