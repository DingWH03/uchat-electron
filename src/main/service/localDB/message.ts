// 新增：存储聊天消息到数据库（支持私聊和群聊）
import { SessionMessage } from '@apiType/HttpRespond'
import { getDB } from './db'

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
    const existing = db
      .prepare(
        `SELECT id FROM messages WHERE account_id = ? AND message_id = ? AND
      ((receiver_id IS ? AND group_id IS ?) OR (receiver_id = ? AND group_id = ?))`
      )
      .get(
        params.account_id,
        params.message_id,
        params.receiver_id ?? null,
        params.group_id ?? null,
        params.receiver_id ?? null,
        params.group_id ?? null
      )
    if (existing) {
      // console.log(
      //   '[DB] 消息已存在，跳过保存，message_id:',
      //   params.message_id,
      //   'receiver_id:',
      //   params.receiver_id,
      //   'group_id:',
      //   params.group_id
      // )
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
    // console.log(
    //   `[DB] 消息保存成功: account_id=${params.account_id}, message_id=${params.message_id}, receiver_id=${params.receiver_id}, group_id=${params.group_id}, content=${params.content}`
    // )
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
