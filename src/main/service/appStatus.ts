// 应用和WebSocket在线状态管理

import { getSessionId } from './config/session'
import { getMyID } from './config/myID'

export type AppStatus = 'unlogin' | 'online' | 'offline'

let currentStatus: AppStatus = 'unlogin'

/**
 * 获取当前应用状态
 */
export function getAppStatus(): AppStatus {
  return currentStatus
}

/**
 * 设置当前应用状态
 * @param status 新的状态
 */
export function setAppStatus(status: AppStatus): void {
  currentStatus = status
  // TODO: 可以在这里广播状态变更事件，或通知前端
  console.log('[AppStatus] 状态切换为', status)
}

/**
 * 是否已登录（sessionId存在且myID非0）
 */
export function isLoggedIn(): boolean {
  return !!getSessionId() && getMyID() !== 0
}

/**
 * 是否在线
 */
export function isOnline(): boolean {
  return currentStatus === 'online'
}

/**
 * 是否离线
 */
export function isOffline(): boolean {
  return currentStatus === 'offline'
}
