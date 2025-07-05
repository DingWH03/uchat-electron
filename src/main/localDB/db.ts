import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import type { SessionMessage } from '../../types/HttpRespond'
import type { Conversation } from '../../types/localDBModel'

let db: Database.Database

const CURRENT_SCHEMA_VERSION = 1 // 升级：修改conversations表使用复合主键

const dbFilePath = join(app.getPath('userData'), 'chat.db') // 存储在用户目录，支持打包后运行

export function initDB(): void {
  db = new Database(dbFilePath)
  db.pragma('foreign_keys = ON')
  db.pragma('journal_mode = WAL') // 使用WAL模式提高性能和数据安全性
  db.pragma('synchronous = NORMAL') // 设置同步模式
  db.pragma('cache_size = 10000') // 设置缓存大小
  db.pragma('busy_timeout = 30000') // 设置忙等待超时时间（30秒）
  db.pragma('locking_mode = EXCLUSIVE') // 使用独占锁模式

  // 检查 user_version
  const row = db.prepare('PRAGMA user_version').get()
  const currentVersion = row.user_version as number
  if (currentVersion !== CURRENT_SCHEMA_VERSION) {
    console.warn(
      `数据库版本不一致，预期: ${CURRENT_SCHEMA_VERSION}，实际: ${currentVersion}，将重建数据库`
    )
    resetDatabase()
  } else {
    createTables() // 确保表存在
  }
}

export function closeDB(): void {
  if (db) {
    console.log('正在关闭数据库连接...')
    // 强制同步所有数据到磁盘
    db.pragma('wal_checkpoint(TRUNCATE)')
    db.close()
    db = null
    console.log('数据库连接已关闭')
  }
}

function resetDatabase(): void {
  // 删除所有表
  db.exec(`
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS friends;
    DROP TABLE IF EXISTS groups;
    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS conversations;
  `)
  createTables()
}

function createTables(): void {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA user_version = ${CURRENT_SCHEMA_VERSION};

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      password TEXT,
      updated_at INTEGER NOT NULL,
      friends_updated_at INTEGER NOT NULL DEFAULT 0,
      groups_updated_at INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT,
      avatar TEXT,
      online INTEGER NOT NULL DEFAULT 0,
      last_online_time INTEGER,
      last_message_timestamp INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      name TEXT,
      description TEXT,
      avatar TEXT,
      last_message_timestamp INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      message_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER,
      group_id INTEGER,
      message_type TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_unique ON messages (account_id, message_id, receiver_id, group_id);

    CREATE TABLE IF NOT EXISTS conversations (
      account_id INTEGER NOT NULL,
      conversation_type TEXT NOT NULL CHECK (conversation_type IN ('friend', 'group')),
      target_id INTEGER NOT NULL,
      target_name TEXT NOT NULL,
      target_avatar TEXT,
      last_message_content TEXT NOT NULL DEFAULT '',
      last_message_timestamp INTEGER NOT NULL DEFAULT 0,
      unread_count INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (account_id, conversation_type, target_id),
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_account_time ON messages (account_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_messages_account_message_id ON messages (account_id, message_id);
    CREATE INDEX IF NOT EXISTS idx_friends_account_user ON friends (account_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_groups_account_group ON groups (account_id, group_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_account_time ON conversations (account_id, last_message_timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_conversations_account_type_target ON conversations (account_id, conversation_type, target_id);
  `)
  
  // 创建触发器来自动更新时间戳
  createTriggers()
}

function createTriggers(): void {
  // 删除已存在的触发器（如果存在）
  db.exec(`
    DROP TRIGGER IF EXISTS update_friend_timestamp_trigger;
    DROP TRIGGER IF EXISTS update_group_timestamp_trigger;
    DROP TRIGGER IF EXISTS update_conversation_friend_trigger;
    DROP TRIGGER IF EXISTS update_conversation_group_trigger;
  `)
  
  // 创建私聊消息触发器
  db.exec(`
    CREATE TRIGGER update_friend_timestamp_trigger
    AFTER INSERT ON messages
    WHEN NEW.group_id IS NULL AND NEW.receiver_id IS NOT NULL
    BEGIN
      UPDATE friends 
      SET last_message_timestamp = CASE 
        WHEN NEW.timestamp > last_message_timestamp THEN NEW.timestamp 
        ELSE last_message_timestamp 
      END
      WHERE account_id = NEW.account_id 
      AND user_id = CASE 
        WHEN NEW.sender_id = NEW.account_id THEN NEW.receiver_id 
        ELSE NEW.sender_id 
      END;
    END;
  `)
  
  // 创建群聊消息触发器
  db.exec(`
    CREATE TRIGGER update_group_timestamp_trigger
    AFTER INSERT ON messages
    WHEN NEW.group_id IS NOT NULL
    BEGIN
      UPDATE groups 
      SET last_message_timestamp = CASE 
        WHEN NEW.timestamp > last_message_timestamp THEN NEW.timestamp 
        ELSE last_message_timestamp 
      END
      WHERE account_id = NEW.account_id 
      AND group_id = NEW.group_id;
    END;
  `)
  
  // 创建私聊会话触发器
  db.exec(`
    CREATE TRIGGER update_conversation_friend_trigger
    AFTER INSERT ON messages
    WHEN NEW.group_id IS NULL AND NEW.receiver_id IS NOT NULL
    BEGIN
      INSERT OR REPLACE INTO conversations (
        account_id, conversation_type, target_id, target_name, target_avatar,
        last_message_content, last_message_timestamp, unread_count, updated_at
      )
      SELECT
        NEW.account_id,
        'friend',
        CASE WHEN NEW.sender_id = NEW.account_id THEN NEW.receiver_id ELSE NEW.sender_id END,
        (SELECT username FROM friends WHERE account_id = NEW.account_id AND user_id = CASE WHEN NEW.sender_id = NEW.account_id THEN NEW.receiver_id ELSE NEW.sender_id END),
        (SELECT avatar FROM friends WHERE account_id = NEW.account_id AND user_id = CASE WHEN NEW.sender_id = NEW.account_id THEN NEW.receiver_id ELSE NEW.sender_id END),
        NEW.content,
        NEW.timestamp,
        CASE WHEN NEW.sender_id != NEW.account_id THEN 1 ELSE 0 END,
        strftime('%s', 'now')
      WHERE EXISTS (
        SELECT 1 FROM friends WHERE account_id = NEW.account_id AND user_id = CASE WHEN NEW.sender_id = NEW.account_id THEN NEW.receiver_id ELSE NEW.sender_id END
      );
    END;
  `)
  
  // 创建群聊会话触发器
  db.exec(`
    CREATE TRIGGER update_conversation_group_trigger
    AFTER INSERT ON messages
    WHEN NEW.group_id IS NOT NULL
    BEGIN
      INSERT OR REPLACE INTO conversations (
        account_id, conversation_type, target_id, target_name, target_avatar,
        last_message_content, last_message_timestamp, unread_count, updated_at
      )
      SELECT
        NEW.account_id,
        'group',
        NEW.group_id,
        (SELECT name FROM groups WHERE account_id = NEW.account_id AND group_id = NEW.group_id),
        (SELECT avatar FROM groups WHERE account_id = NEW.account_id AND group_id = NEW.group_id),
        NEW.content,
        NEW.timestamp,
        CASE WHEN NEW.sender_id != NEW.account_id THEN 1 ELSE 0 END,
        strftime('%s', 'now')
      WHERE EXISTS (
        SELECT 1 FROM groups WHERE account_id = NEW.account_id AND group_id = NEW.group_id
      );
    END;
  `)
  
  console.log('[DB] 触发器创建完成')
}

export function getDB(): Database.Database {
  if (!db) throw new Error('数据库未初始化')
  return db
}

// 新增：存储聊天消息到数据库（支持私聊和群聊）
/**
 * 存储聊天消息到本地数据库
 * @param params 消息参数
 * @param params.account_id 当前账号ID
 * @param params.sender_id 发送者ID
 * @param params.receiver_id 接收者ID（私聊时必填，群聊为null）
 * @param params.group_id 群聊ID（群聊时必填，私聊为null）
 * @param params.message_type 消息类型
 * @param params.content 消息内容
 * @param params.timestamp 消息时间戳
 * @returns 是否存储成功
 */
export function saveMessageToDB(params: {
  account_id: number
  message_id: number
  sender_id: number
  receiver_id?: number | null
  group_id?: number | null
  message_type: string
  content: string
  timestamp: number
}): boolean {
  try {
    const db = getDB()
    // 新查重逻辑：联合唯一索引
    const existing = db.prepare(
      `SELECT id FROM messages WHERE account_id = ? AND message_id = ? AND 
      ((receiver_id IS ? AND group_id IS ?) OR (receiver_id = ? AND group_id = ?))`
    ).get(
      params.account_id,
      params.message_id,
      params.receiver_id ?? null,
      params.group_id ?? null,
      params.receiver_id ?? null,
      params.group_id ?? null
    )
    if (existing) {
      console.log('[DB] 消息已存在，跳过保存，message_id:', params.message_id, 'receiver_id:', params.receiver_id, 'group_id:', params.group_id)
      return true // 返回true表示"成功"（因为消息已经存在）
    }
    db.prepare(
      `INSERT INTO messages (account_id, message_id, sender_id, receiver_id, group_id, message_type, content, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      params.account_id,
      params.message_id,
      params.sender_id,
      params.receiver_id ?? null,
      params.group_id ?? null,
      params.message_type,
      params.content,
      params.timestamp
    )
    console.log(`[DB] 消息保存成功: account_id=${params.account_id}, message_id=${params.message_id}, receiver_id=${params.receiver_id}, group_id=${params.group_id}, content=${params.content}`)
    return true
  } catch (err) {
    console.error('[DB] 存储消息失败:', err)
    return false
  }
}

/**
 * 获取本地群聊聊天记录（分页）
 */
export function getLocalGroupMessages(
  accountId: number,
  groupId: number,
  offset: number,
  limit: number
): SessionMessage[] {
  const db = getDB()
  const rows = db
    .prepare(
      `SELECT sender_id, message_type, content, timestamp
     FROM messages
     WHERE account_id = ? AND group_id = ?
     ORDER BY timestamp ASC
     LIMIT ? OFFSET ?`
    )
    .all(accountId, groupId, limit, offset)
  return rows.map((row) => ({
    sender_id: row.sender_id,
    message_type: row.message_type,
    content: row.content,
    timestamp: row.timestamp
  }))
}

/**
 * 获取本地私聊聊天记录（分页）
 */
export function getLocalPrivateMessages(
  accountId: number,
  userId: number,
  offset: number,
  limit: number
): SessionMessage[] {
  const db = getDB()
  const rows = db
    .prepare(
      `SELECT sender_id, message_type, content, timestamp
     FROM messages
     WHERE account_id = ? AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
     ORDER BY timestamp ASC
     LIMIT ? OFFSET ?`
    )
    .all(accountId, userId, accountId, accountId, userId, limit, offset)
  return rows.map((row) => ({
    sender_id: row.sender_id,
    message_type: row.message_type,
    content: row.content,
    timestamp: row.timestamp
  }))
}

/**
 * 获取本地群聊某时间戳后的消息
 */
export function getLocalGroupMessagesAfterTimestamp(
  accountId: number,
  groupId: number,
  after: number
): SessionMessage[] {
  const db = getDB()
  const rows = db
    .prepare(
      `SELECT sender_id, message_type, content, timestamp
     FROM messages
     WHERE account_id = ? AND group_id = ? AND timestamp > ?
     ORDER BY timestamp ASC`
    )
    .all(accountId, groupId, after)
  return rows.map((row) => ({
    sender_id: row.sender_id,
    message_type: row.message_type,
    content: row.content,
    timestamp: row.timestamp
  }))
}

/**
 * 获取本地私聊某时间戳后的消息
 */
export function getLocalPrivateMessagesAfterTimestamp(
  accountId: number,
  userId: number,
  after: number
): SessionMessage[] {
  const db = getDB()
  const rows = db
    .prepare(
      `SELECT sender_id, message_type, content, timestamp
     FROM messages
     WHERE account_id = ? AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) AND timestamp > ?
     ORDER BY timestamp ASC`
    )
    .all(accountId, userId, accountId, accountId, userId, after)
  return rows.map((row) => ({
    sender_id: row.sender_id,
    message_type: row.message_type,
    content: row.content,
    timestamp: row.timestamp
  }))
}

// 会话相关操作函数

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
  const conversations = db.prepare('SELECT conversation_type, target_id, target_name, last_message_content FROM conversations WHERE account_id = ?').all(accountId)
  console.log(`[DEBUG] 账户 ${accountId} 的会话信息:`, conversations)
  
  // 检查消息信息
  const messages = db.prepare('SELECT group_id, content, timestamp FROM messages WHERE account_id = ? AND group_id IS NOT NULL ORDER BY timestamp DESC LIMIT 5').all(accountId)
  console.log(`[DEBUG] 账户 ${accountId} 的最近群聊消息:`, messages)
  
  // 检查所有消息信息
  const allMessages = db.prepare('SELECT group_id, receiver_id, content, timestamp FROM messages WHERE account_id = ? ORDER BY timestamp DESC LIMIT 10').all(accountId)
  console.log(`[DEBUG] 账户 ${accountId} 的所有最近消息:`, allMessages)
  
  // 检查messages表的总数
  const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE account_id = ?').get(accountId)
  console.log(`[DEBUG] 账户 ${accountId} 的消息总数:`, messageCount?.count || 0)
  
  // 检查群聊消息数量
  const groupMessageCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE account_id = ? AND group_id IS NOT NULL').get(accountId)
  console.log(`[DEBUG] 账户 ${accountId} 的群聊消息数量:`, groupMessageCount?.count || 0)
}
