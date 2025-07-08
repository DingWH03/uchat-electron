// 会话相关操作函数

import { Conversation } from '@apiType/Model'
import { getDB } from './db'

/**
 * 获取用户的所有会话列表（按最后消息时间排序）
 */
export function getConversations(accountId: number): Conversation[] {
  const db = getDB()
  const rows = db
    .prepare(
      `SELECT account_id, conversation_type, target_id, target_name, target_avatar,
              last_message_content, last_message_timestamp, unread_count, updated_at
       FROM conversations
       WHERE account_id = ?
       ORDER BY last_message_timestamp DESC`
    )
    .all(accountId)
  return rows as Conversation[]
}

/**
 * 获取指定会话信息
 */
export function getConversation(
  accountId: number,
  conversationType: string,
  targetId: number
): Conversation | null {
  const db = getDB()
  const row = db
    .prepare(
      `SELECT account_id, conversation_type, target_id, target_name, target_avatar,
              last_message_content, last_message_timestamp, unread_count, updated_at
       FROM conversations
       WHERE account_id = ? AND conversation_type = ? AND target_id = ?`
    )
    .get(accountId, conversationType, targetId)
  return row as Conversation | null
}

/**
 * 更新会话未读消息数
 */
export function updateConversationUnreadCount(
  accountId: number,
  conversationType: string,
  targetId: number,
  unreadCount: number
): boolean {
  try {
    const db = getDB()
    db.prepare(
      `UPDATE conversations
       SET unread_count = ?, updated_at = strftime('%s', 'now')
       WHERE account_id = ? AND conversation_type = ? AND target_id = ?`
    ).run(unreadCount, accountId, conversationType, targetId)
    return true
  } catch (err) {
    console.error('[DB] 更新会话未读消息数失败:', err)
    return false
  }
}

/**
 * 重置会话未读消息数（标记为已读）
 */
export function markConversationAsRead(
  accountId: number,
  conversationType: string,
  targetId: number
): boolean {
  return updateConversationUnreadCount(accountId, conversationType, targetId, 0)
}

/**
 * 删除会话
 */
export function deleteConversation(
  accountId: number,
  conversationType: string,
  targetId: number
): boolean {
  try {
    const db = getDB()
    db.prepare(
      `DELETE FROM conversations
       WHERE account_id = ? AND conversation_type = ? AND target_id = ?`
    ).run(accountId, conversationType, targetId)
    return true
  } catch (err) {
    console.error('[DB] 删除会话失败:', err)
    return false
  }
}

/**
 * 获取会话总数
 */
export function getConversationCount(accountId: number): number {
  const db = getDB()
  const row = db
    .prepare(`SELECT COUNT(*) as count FROM conversations WHERE account_id = ?`)
    .get(accountId)
  return row?.count || 0
}

/**
 * 获取总未读消息数
 */
export function getTotalUnreadCount(accountId: number): number {
  const db = getDB()
  const row = db
    .prepare(`SELECT SUM(unread_count) as total FROM conversations WHERE account_id = ?`)
    .get(accountId)
  return row?.total || 0
}

/**
 * 调试函数：检查数据库中的群组和会话信息
 */
export function debugDatabaseInfo(accountId: number): void {
  const db = getDB()

  // 检查群组信息
  const groups = db.prepare('SELECT group_id, name FROM groups WHERE account_id = ?').all(accountId)
  console.log(`[DEBUG] 账户 ${accountId} 的群组信息:`, groups)

  // 检查会话信息
  const conversations = db
    .prepare(
      'SELECT conversation_type, target_id, target_name, last_message_content FROM conversations WHERE account_id = ?'
    )
    .all(accountId)
  console.log(`[DEBUG] 账户 ${accountId} 的会话信息:`, conversations)

  // 检查消息信息
  const messages = db
    .prepare(
      'SELECT group_id, content, timestamp FROM messages WHERE account_id = ? AND group_id IS NOT NULL ORDER BY timestamp DESC LIMIT 5'
    )
    .all(accountId)
  console.log(`[DEBUG] 账户 ${accountId} 的最近群聊消息:`, messages)

  // 检查所有消息信息
  const allMessages = db
    .prepare(
      'SELECT group_id, receiver_id, content, timestamp FROM messages WHERE account_id = ? ORDER BY timestamp DESC LIMIT 10'
    )
    .all(accountId)
  console.log(`[DEBUG] 账户 ${accountId} 的所有最近消息:`, allMessages)

  // 检查messages表的总数
  const messageCount = db
    .prepare('SELECT COUNT(*) as count FROM messages WHERE account_id = ?')
    .get(accountId)
  console.log(`[DEBUG] 账户 ${accountId} 的消息总数:`, messageCount?.count || 0)

  // 检查群聊消息数量
  const groupMessageCount = db
    .prepare('SELECT COUNT(*) as count FROM messages WHERE account_id = ? AND group_id IS NOT NULL')
    .get(accountId)
  console.log(`[DEBUG] 账户 ${accountId} 的群聊消息数量:`, groupMessageCount?.count || 0)
}
