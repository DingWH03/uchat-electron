import { ipcMain } from 'electron'
import {
  getConversations,
  getConversation,
  updateConversationUnreadCount,
  markConversationAsRead,
  deleteConversation,
  getConversationCount,
  getTotalUnreadCount
} from '@main/service/localDB'
import type { ApiResponse, Conversation } from '@apiType/Model'
import { getMyID } from '../config/myID'

export function registerConversationHandlers(): void {
  // 获取会话列表
  ipcMain.handle(
    'api:conversation/get-conversations',
    async (): Promise<ApiResponse<Conversation[]>> => {
      try {
        const id = getMyID()
        const conversations = getConversations(id)
        return {
          success: true,
          data: conversations
        }
      } catch (error) {
        console.error('[API] 获取会话列表失败:', error)
        return {
          success: false,
          error: '获取会话列表失败'
        }
      }
    }
  )

  // 获取指定会话信息
  ipcMain.handle(
    'api:conversation/get-conversation',
    async (
      _event,
      conversationType: string,
      targetId: number
    ): Promise<ApiResponse<Conversation | null>> => {
      try {
        const id = getMyID()
        const conversation = getConversation(id, conversationType, targetId)
        return {
          success: true,
          data: conversation
        }
      } catch (error) {
        console.error('[API] 获取会话信息失败:', error)
        return {
          success: false,
          error: '获取会话信息失败'
        }
      }
    }
  )

  // 更新会话未读消息数
  ipcMain.handle(
    'api:conversation/update-conversation-unread',
    async (
      _event,
      conversationType: string,
      targetId: number,
      unreadCount: number
    ): Promise<ApiResponse<boolean>> => {
      try {
        const id = getMyID()
        const success = updateConversationUnreadCount(id, conversationType, targetId, unreadCount)
        return {
          success: true,
          data: success
        }
      } catch (error) {
        console.error('[API] 更新会话未读消息数失败:', error)
        return {
          success: false,
          error: '更新会话未读消息数失败'
        }
      }
    }
  )

  // 标记会话为已读
  ipcMain.handle(
    'api:conversation/mark-conversation-read',
    async (_event, conversationType: string, targetId: number): Promise<ApiResponse<boolean>> => {
      try {
        const id = getMyID()
        const success = markConversationAsRead(id, conversationType, targetId)
        return {
          success: true,
          data: success
        }
      } catch (error) {
        console.error('[API] 标记会话已读失败:', error)
        return {
          success: false,
          error: '标记会话已读失败'
        }
      }
    }
  )

  // 删除会话
  ipcMain.handle(
    'api:conversation/delete-conversation',
    async (_event, conversationType: string, targetId: number): Promise<ApiResponse<boolean>> => {
      try {
        const id = getMyID()
        const success = deleteConversation(id, conversationType, targetId)
        return {
          success: true,
          data: success
        }
      } catch (error) {
        console.error('[API] 删除会话失败:', error)
        return {
          success: false,
          error: '删除会话失败'
        }
      }
    }
  )

  // 获取会话总数
  ipcMain.handle(
    'api:conversation/get-conversation-count',
    async (): Promise<ApiResponse<number>> => {
      try {
        const id = getMyID()
        const count = getConversationCount(id)
        return {
          success: true,
          data: count
        }
      } catch (error) {
        console.error('[API] 获取会话总数失败:', error)
        return {
          success: false,
          error: '获取会话总数失败'
        }
      }
    }
  )

  // 获取总未读消息数
  ipcMain.handle(
    'api:conversation/get-total-unread-count',
    async (): Promise<ApiResponse<number>> => {
      try {
        const id = getMyID()
        const count = getTotalUnreadCount(id)
        return {
          success: true,
          data: count
        }
      } catch (error) {
        console.error('[API] 获取总未读消息数失败:', error)
        return {
          success: false,
          error: '获取总未读消息数失败'
        }
      }
    }
  )
}
