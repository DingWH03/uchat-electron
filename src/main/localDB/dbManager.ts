import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import fs from 'fs'

// 数据库管理器类
export class DatabaseManager {
  private static instance: DatabaseManager
  private defaultDB: Database.Database | null = null
  private accountDBs: Map<number, Database.Database> = new Map()
  private currentAccountId: number | null = null

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  // 初始化默认数据库（存储账号信息）
  initDefaultDB(): void {
    const defaultDBPath = join(app.getPath('userData'), 'accounts.db')
    this.defaultDB = new Database(defaultDBPath)
    this.setupDefaultDB(this.defaultDB)
    // console.log('[DBManager] 默认数据库初始化完成:', defaultDBPath)
  }

  // 设置默认数据库
  private setupDefaultDB(db: Database.Database): void {
    db.pragma('foreign_keys = ON')
    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')
    db.pragma('cache_size = 10000')
    db.pragma('busy_timeout = 30000')
    db.pragma('locking_mode = EXCLUSIVE')

    // 创建账号表
    db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        password TEXT,
        updated_at INTEGER NOT NULL,
        last_login_at INTEGER,
        is_active INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts (is_active);
      CREATE INDEX IF NOT EXISTS idx_accounts_updated ON accounts (updated_at DESC);
    `)
  }

  // 获取默认数据库
  getDefaultDB(): Database.Database {
    if (!this.defaultDB) {
      throw new Error('默认数据库未初始化')
    }
    return this.defaultDB
  }

  // 初始化指定账号的数据库
  initAccountDB(accountId: number): void {
    if (this.accountDBs.has(accountId)) {
      // console.log(`[DBManager] 账号 ${accountId} 的数据库已存在`)
      return
    }

    const accountDBPath = join(app.getPath('userData'), `account_${accountId}.db`)
    const db = new Database(accountDBPath)
    this.setupAccountDB(db)
    this.accountDBs.set(accountId, db)
    // console.log(`[DBManager] 账号 ${accountId} 数据库初始化完成:`, accountDBPath)
  }

  // 设置账号数据库
  private setupAccountDB(db: Database.Database): void {
    db.pragma('foreign_keys = ON')
    db.pragma('journal_mode = WAL')
    db.pragma('synchronous = NORMAL')
    db.pragma('cache_size = 10000')
    db.pragma('busy_timeout = 30000')
    db.pragma('locking_mode = EXCLUSIVE')

    // 创建账号数据库的表结构
    this.createAccountTables(db)
    this.createAccountTriggers(db)
  }

  // 创建账号数据库的表
  private createAccountTables(db: Database.Database): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        username TEXT,
        avatar TEXT,
        online INTEGER NOT NULL DEFAULT 0,
        last_online_time INTEGER,
        last_message_timestamp INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        name TEXT,
        description TEXT,
        avatar TEXT,
        last_message_timestamp INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER,
        group_id INTEGER,
        message_type TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_unique ON messages (message_id, receiver_id, group_id);

      CREATE TABLE IF NOT EXISTS conversations (
        conversation_type TEXT NOT NULL CHECK (conversation_type IN ('friend', 'group')),
        target_id INTEGER NOT NULL,
        target_name TEXT NOT NULL,
        target_avatar TEXT,
        last_message_content TEXT NOT NULL DEFAULT '',
        last_message_timestamp INTEGER NOT NULL DEFAULT 0,
        unread_count INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (conversation_type, target_id)
      );

      CREATE INDEX IF NOT EXISTS idx_messages_time ON messages (timestamp);
      CREATE INDEX IF NOT EXISTS idx_messages_message_id ON messages (message_id);
      CREATE INDEX IF NOT EXISTS idx_friends_user ON friends (user_id);
      CREATE INDEX IF NOT EXISTS idx_groups_group ON groups (group_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_time ON conversations (last_message_timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_conversations_type_target ON conversations (conversation_type, target_id);
    `)
  }

  // 创建账号数据库的触发器
  private createAccountTriggers(db: Database.Database): void {
    // 删除已存在的触发器
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
        WHERE user_id = CASE
          WHEN NEW.sender_id = (SELECT id FROM accounts WHERE is_active = 1 LIMIT 1) THEN NEW.receiver_id
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
        WHERE group_id = NEW.group_id;
      END;
    `)

    // 创建私聊会话触发器
    db.exec(`
      CREATE TRIGGER update_conversation_friend_trigger
      AFTER INSERT ON messages
      WHEN NEW.group_id IS NULL AND NEW.receiver_id IS NOT NULL
      BEGIN
        INSERT OR REPLACE INTO conversations (
          conversation_type, target_id, target_name, target_avatar,
          last_message_content, last_message_timestamp, unread_count, updated_at
        )
        SELECT
          'friend',
          CASE WHEN NEW.sender_id = (SELECT id FROM accounts WHERE is_active = 1 LIMIT 1) THEN NEW.receiver_id ELSE NEW.sender_id END,
          (SELECT username FROM friends WHERE user_id = CASE WHEN NEW.sender_id = (SELECT id FROM accounts WHERE is_active = 1 LIMIT 1) THEN NEW.receiver_id ELSE NEW.sender_id END),
          (SELECT avatar FROM friends WHERE user_id = CASE WHEN NEW.sender_id = (SELECT id FROM accounts WHERE is_active = 1 LIMIT 1) THEN NEW.receiver_id ELSE NEW.sender_id END),
          NEW.content,
          NEW.timestamp,
          CASE WHEN NEW.sender_id != (SELECT id FROM accounts WHERE is_active = 1 LIMIT 1) THEN 1 ELSE 0 END,
          strftime('%s', 'now')
        WHERE EXISTS (
          SELECT 1 FROM friends WHERE user_id = CASE WHEN NEW.sender_id = (SELECT id FROM accounts WHERE is_active = 1 LIMIT 1) THEN NEW.receiver_id ELSE NEW.sender_id END
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
          conversation_type, target_id, target_name, target_avatar,
          last_message_content, last_message_timestamp, unread_count, updated_at
        )
        SELECT
          'group',
          NEW.group_id,
          (SELECT name FROM groups WHERE group_id = NEW.group_id),
          (SELECT avatar FROM groups WHERE group_id = NEW.group_id),
          NEW.content,
          NEW.timestamp,
          CASE WHEN NEW.sender_id != (SELECT id FROM accounts WHERE is_active = 1 LIMIT 1) THEN 1 ELSE 0 END,
          strftime('%s', 'now')
        WHERE EXISTS (
          SELECT 1 FROM groups WHERE group_id = NEW.group_id
        );
      END;
    `)
  }

  // 切换当前账号
  switchAccount(accountId: number): void {
    if (!this.accountDBs.has(accountId)) {
      this.initAccountDB(accountId)
    }
    this.currentAccountId = accountId
    // console.log(`[DBManager] 切换到账号: ${accountId}`)
  }

  // 获取当前账号的数据库
  getCurrentAccountDB(): Database.Database {
    if (this.currentAccountId === null) {
      throw new Error('未设置当前账号')
    }
    const db = this.accountDBs.get(this.currentAccountId)
    if (!db) {
      throw new Error(`账号 ${this.currentAccountId} 的数据库未初始化`)
    }
    return db
  }

  // 获取指定账号的数据库
  getAccountDB(accountId: number): Database.Database {
    const db = this.accountDBs.get(accountId)
    if (!db) {
      throw new Error(`账号 ${accountId} 的数据库未初始化`)
    }
    return db
  }

  // 获取当前账号ID
  getCurrentAccountId(): number | null {
    return this.currentAccountId
  }

  // 关闭指定账号的数据库
  closeAccountDB(accountId: number): void {
    const db = this.accountDBs.get(accountId)
    if (db) {
      db.pragma('wal_checkpoint(TRUNCATE)')
      db.close()
      this.accountDBs.delete(accountId)
      // console.log(`[DBManager] 已关闭账号 ${accountId} 的数据库`)
    }
  }

  // 关闭所有数据库连接
  closeAll(): void {
    if (this.defaultDB) {
      this.defaultDB.pragma('wal_checkpoint(TRUNCATE)')
      this.defaultDB.close()
      this.defaultDB = null
    }

    for (const [accountId, db] of this.accountDBs) {
      db.pragma('wal_checkpoint(TRUNCATE)')
      db.close()
      // console.log(`[DBManager] 已关闭账号 ${accountId} 的数据库`)
    }
    this.accountDBs.clear()
    this.currentAccountId = null
    // console.log('[DBManager] 所有数据库连接已关闭')
  }

  // 删除指定账号的数据库文件
  deleteAccountDB(accountId: number): void {
    this.closeAccountDB(accountId)

    const accountDBPath = join(app.getPath('userData'), `account_${accountId}.db`)
    try {
      if (fs.existsSync(accountDBPath)) {
        fs.unlinkSync(accountDBPath)
        // console.log(`[DBManager] 已删除账号 ${accountId} 的数据库文件:`, accountDBPath)
      }
    } catch (error) {
      console.error(`[DBManager] 删除账号 ${accountId} 数据库文件失败:`, error)
    }
  }

  // 获取所有已初始化的账号ID
  getInitializedAccountIds(): number[] {
    return Array.from(this.accountDBs.keys())
  }
}

// 导出单例实例
export const dbManager = DatabaseManager.getInstance()
