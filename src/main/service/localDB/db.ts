import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'

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

  console.log('[DB] 数据库初始化完成')
}

export function getDB(): Database.Database {
  if (!db) throw new Error('数据库未初始化')
  return db
}
