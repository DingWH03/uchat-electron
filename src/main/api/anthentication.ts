// main/api/anthentication.ts
import { BrowserWindow, ipcMain } from 'electron'
import { getApiBaseUrl } from '../config/url'
import { getSessionId, setSessionId } from '../config/session'
import { RegisterRequest, LoginRequest, PasswordRequest } from '../../types/HttpRequest'
import { closeWebSocket, setupWebSocket } from '../WebSocket/wsClient'
import { RequestResponse } from '../../types/HttpRespond'
import { syncContacts } from '../localDB'

let loginUser: number = 0

export const myID = (): number => {
  // console.log('[myID] 当前 loginUser:', loginUser)
  return loginUser
}

// 新增：检测网络和 session 的函数
export async function checkNetworkAndSession(
  win: BrowserWindow
): Promise<'ok' | 'network-error' | 'session-invalid'> {
  const baseUrl = getApiBaseUrl()
  // 1. 检查 /ping
  try {
    const pingRes = await fetch(`${baseUrl}/ping`)
    if (!pingRes.ok) throw new Error()
  } catch {
    win.webContents.send('ws:status', 'network-error')
    return 'network-error'
  }
  // 2. 检查 session
  const sessionId = getSessionId()
  try {
    const sessionRes = await fetch(`${baseUrl}/auth/myid`, {
      headers: { Cookie: `session_id=${sessionId}` }
    })
    const sessionData = await sessionRes.json()
    console.log('[checkNetworkAndSession] 会话检查响应:', sessionData)
    if (!sessionData || sessionData.status === false) {
      win.webContents.send('ws:status', 'session-invalid')
      return 'session-invalid'
    }
    // 如果会话有效，设置用户ID
    if (sessionData.data && sessionData.data.userid) {
      console.log('[checkNetworkAndSession] 从会话中恢复用户ID:', sessionData.data.userid)
      loginUser = sessionData.data.userid
    }
  } catch {
    win.webContents.send('ws:status', 'session-invalid')
    return 'session-invalid'
  }
  return 'ok'
}

export async function performLogout(): Promise<RequestResponse<void>> {
  closeWebSocket()
  const baseUrl = getApiBaseUrl()
  const sessionId = getSessionId()
  const res = await fetch(`${baseUrl}/auth/logout`, {
    method: 'POST',
    headers: {
      Cookie: `session_id=${sessionId}`
    }
  })
  setSessionId(null)
  loginUser = 0
  return res.json()
}

export function registerAnthenticationApi(win: BrowserWindow): void {
  // 注册账号的后端接口调用
  ipcMain.handle(
    'api:auth/register',
    async (_, registerData: RegisterRequest): Promise<RequestResponse<number>> => {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      })
      return res.json()
    }
  )
  // 登陆的后端接口调用
  ipcMain.handle('api:auth/login', async (_, loginData: LoginRequest): Promise<boolean> => {
    // console.log('[Login] 开始登录，用户ID:', loginData.userid)
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    })
    const data = await res.json()
    // console.log('[Login] 登录响应:', data)
    if (data.status) {
      // console.log('[Login] 登录成功，设置 sessionId 和 loginUser')
      setSessionId(data.data)
      // console.log('[Login] 设置 loginUser 前:', loginUser)
      loginUser = loginData.userid // 保存登陆用户的id
      // console.log('[Login] 设置 loginUser 后:', loginUser)
      // console.log('[Login] 调用 myID() 验证:', myID())

      // console.log('[Login] 开始同步联系人...')
      await syncContacts() // 同步联系人数据到本地数据库
      // console.log('[Login] 联系人同步完成，再次验证 myID():', myID())

      // console.log('[Login] 开始设置 WebSocket...')
      setupWebSocket(win)

      win.setResizable(true)
      // win.setTitleBarOverlay()
    } else {
      console.error('[Login] 登录失败')
    }
    return data.status
  })
  // 注销的后端接口调用
  ipcMain.handle('api:auth/logout', async (): Promise<RequestResponse<void>> => {
    return performLogout()
  })
  // 修改密码的后端接口调用
  ipcMain.handle(
    'api:auth/password',
    async (_, requestData: PasswordRequest): Promise<RequestResponse<void>> => {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/auth/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })
      return res.json()
    }
  )
  // 获取登陆用户id的后端api
  ipcMain.handle('api:auth/myid', (): number => {
    return loginUser
  })
}
