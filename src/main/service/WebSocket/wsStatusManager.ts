import { BrowserWindow } from 'electron'
import { user_status } from '@main/service/api/friend'
import { updateFriendStatus, updateFriendsStatus, getAllFriendIds } from '@main/service/localDB'
import { getMyID } from '../config/myID'

export class WebSocketStatusManager {
  private win: BrowserWindow

  constructor(win: BrowserWindow) {
    this.win = win
  }

  /**
   * WebSocket连接成功后查询所有好友状态
   */
  async queryAllFriendsStatus(): Promise<void> {
    try {
      const accountId = getMyID()
      if (!accountId) {
        console.warn('[WebSocketStatusManager] 未找到当前用户ID，跳过状态查询')
        return
      }

      const friendIds = getAllFriendIds(accountId)
      if (friendIds.length === 0) {
        // console.log('[WebSocketStatusManager] 没有好友，跳过状态查询')
        return
      }

      // console.log(`[WebSocketStatusManager] 开始查询 ${friendIds.length} 个好友的状态`)
      const response = await user_status(friendIds)

      if (response.status && response.data) {
        updateFriendsStatus(accountId, response.data)
        // console.log(`[WebSocketStatusManager] 成功更新 ${response.data.length} 个好友的状态`)

        // 通知前端好友状态已更新
        this.win.webContents.send('friend:status-updated', response.data)
      } else {
        console.warn('[WebSocketStatusManager] 查询好友状态失败:', response.message)
        // 即使查询失败也不抛出异常，避免影响WebSocket连接
      }
    } catch (error) {
      console.error('[WebSocketStatusManager] 查询好友状态时发生错误:', error)
      // 捕获所有异常，避免影响WebSocket连接
    }
  }

  /**
   * 处理好友上线消息
   */
  handleFriendOnline(friendId: number): void {
    try {
      const accountId = getMyID()
      if (!accountId) {
        console.warn('[WebSocketStatusManager] 未找到当前用户ID，跳过状态更新')
        return
      }

      console.log(`[WebSocketStatusManager] 好友 ${friendId} 上线`)

      // 先更新数据库
      updateFriendStatus(accountId, friendId, true)

      // 再通知前端
      this.win.webContents.send('friend:online', { user_id: friendId })
    } catch (error) {
      console.error('[WebSocketStatusManager] 处理好友上线消息时发生错误:', error)
    }
  }

  /**
   * 处理好友下线消息
   */
  handleFriendOffline(friendId: number): void {
    try {
      const accountId = getMyID()
      if (!accountId) {
        console.warn('[WebSocketStatusManager] 未找到当前用户ID，跳过状态更新')
        return
      }

      console.log(`[WebSocketStatusManager] 好友 ${friendId} 下线`)

      // 先更新数据库
      updateFriendStatus(accountId, friendId, false)

      // 再通知前端
      this.win.webContents.send('friend:offline', { user_id: friendId })
    } catch (error) {
      console.error('[WebSocketStatusManager] 处理好友下线消息时发生错误:', error)
    }
  }
}
