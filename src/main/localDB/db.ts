import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { app } from 'electron'

import initSqlJs, { SqlJsStatic, Database } from 'sql.js'
// 引入类型 SqlJsStatic（初始化返回值），和 Database（表示数据库对象）

let db: Database
let SQL: SqlJsStatic

const dbFilePath = join(app.getPath('userData'), 'chat.db') // 存储在用户目录，支持打包后运行

export async function initDB(): Promise<void> {
  const wasmPath = join(app.getAppPath(), `./resources/sql-wasm.wasm`)
  const wasmURL = pathToFileURL(wasmPath).href

  SQL = await initSqlJs({
    locateFile: () => wasmURL
  })

  try {
    const fileBuffer = await readFile(dbFilePath)
    db = new SQL.Database(fileBuffer)
    console.log('数据库加载成功')
  } catch {
    db = new SQL.Database()
    console.log('创建新数据库')
    createTables()
    await persistDB()
  }
}

function createTables(): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );


    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY,
      username TEXT,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY,
      name TEXT,
      description TEXT,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER,
      group_id INTEGER,
      message_type TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
  `)
}

export async function persistDB(): Promise<void> {
  const data = db.export()
  await writeFile(dbFilePath, Buffer.from(data))
}

export function getDB(): Database {
  if (!db) throw new Error('数据库未初始化')
  return db
}
