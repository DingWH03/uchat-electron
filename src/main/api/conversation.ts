import { ipcMain } from 'electron'
import {
  getConversations,
  getConversation,
  updateConversationUnreadCount,
  markConversationAsRead,
  deleteConversation,
  getConversationCount,
  getTotalUnreadCount,
  getDB
} from '../localDB/db'
import type { DBResult, Conversation } from '../../types/localDBModel'

// 获取会话列表
ipcMain.handle('get-conversations', async (event): Promise<DBResult<Conversation[]>> => {
  try {
    // 从当前登录的账号获取accountId
    const db = getDB()
    const accounts = db.prepare('SELECT id FROM accounts ORDER BY updated_at DESC LIMIT 1').get()
    if (!accounts) {
      return {
        success: false,
        error: '未找到登录账号'
      }
    }
    const conversations = getConversations(accounts.id)
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
})

// 获取指定会话信息
ipcMain.handle('get-conversation', async (event, conversationType: string, targetId: number): Promise<DBResult<Conversation | null>> => {
  try {
    const db = getDB()
    const accounts = db.prepare('SELECT id FROM accounts ORDER BY updated_at DESC LIMIT 1').get()
    if (!accounts) {
      return {
        success: false,
        error: '未找到登录账号'
      }
    }
    const conversation = getConversation(accounts.id, conversationType, targetId)
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
})

// 更新会话未读消息数
ipcMain.handle('update-conversation-unread', async (event, conversationType: string, targetId: number, unreadCount: number): Promise<DBResult<boolean>> => {
  try {
    const db = getDB()
    const accounts = db.prepare('SELECT id FROM accounts ORDER BY updated_at DESC LIMIT 1').get()
    if (!accounts) {
      return {
        success: false,
        error: '未找到登录账号'
      }
    }
    const success = updateConversationUnreadCount(accounts.id, conversationType, targetId, unreadCount)
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
})

// 标记会话为已读
ipcMain.handle('mark-conversation-read', async (event, conversationType: string, targetId: number): Promise<DBResult<boolean>> => {
  try {
    const db = getDB()
    const accounts = db.prepare('SELECT id FROM accounts ORDER BY updated_at DESC LIMIT 1').get()
    if (!accounts) {
      return {
        success: false,
        error: '未找到登录账号'
      }
    }
    const success = markConversationAsRead(accounts.id, conversationType, targetId)
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
})

// 删除会话
ipcMain.handle('delete-conversation', async (event, conversationType: string, targetId: number): Promise<DBResult<boolean>> => {
  try {
    const db = getDB()
    const accounts = db.prepare('SELECT id FROM accounts ORDER BY updated_at DESC LIMIT 1').get()
    if (!accounts) {
      return {
        success: false,
        error: '未找到登录账号'
      }
    }
    const success = deleteConversation(accounts.id, conversationType, targetId)
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
})

// 获取会话总数
ipcMain.handle('get-conversation-count', async (event): Promise<DBResult<number>> => {
  try {
    const db = getDB()
    const accounts = db.prepare('SELECT id FROM accounts ORDER BY updated_at DESC LIMIT 1').get()
    if (!accounts) {
      return {
        success: false,
        error: '未找到登录账号'
      }
    }
    const count = getConversationCount(accounts.id)
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
})

// 获取总未读消息数
ipcMain.handle('get-total-unread-count', async (event): Promise<DBResult<number>> => {
  try {
    const db = getDB()
    const accounts = db.prepare('SELECT id FROM accounts ORDER BY updated_at DESC LIMIT 1').get()
    if (!accounts) {
      return {
        success: false,
        error: '未找到登录账号'
      }
    }
    const count = getTotalUnreadCount(accounts.id)
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
}) 