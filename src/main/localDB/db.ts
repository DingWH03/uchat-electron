import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'

let db: Database.Database

const CURRENT_SCHEMA_VERSION = 5 // 每次结构变更时+1

const dbFilePath = join(app.getPath('userData'), 'chat.db') // 存储在用户目录，支持打包后运行

export function initDB(): void {
  db = new Database(dbFilePath)
  db.pragma('foreign_keys = ON')
  db.pragma('journal_mode = WAL') // 使用WAL模式提高性能和数据安全性
  db.pragma('synchronous = NORMAL') // 设置同步模式
  db.pragma('cache_size = 10000') // 设置缓存大小
  
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
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      name TEXT,
      description TEXT,
      avatar TEXT,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER,
      group_id INTEGER,
      message_type TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_messages_account_time ON messages (account_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_friends_account_user ON friends (account_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_groups_account_group ON groups (account_id, group_id);
  `)
}

export function getDB(): Database.Database {
  if (!db) throw new Error('数据库未初始化')
  return db
}
