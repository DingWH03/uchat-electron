// main/api/anthentication.ts
import { BrowserWindow, ipcMain } from 'electron'
import { getApiBaseUrl } from './config'
import { getSessionId, setSessionId } from '../session'
import { RegisterRequest, LoginRequest, PasswordRequest } from '../../types/HttpRequest'
import { closeWebSocket, setupWebSocket } from '../WebSocket/wsClient'
import { RequestResponse } from '../../types/HttpRespond'
import { syncContacts } from '../localDB'

let loginUser: number = 0

export const myID = (): number => {
  return loginUser
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
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    })
    const data = await res.json()
    if (data.status) {
      setSessionId(data.data)
      setupWebSocket(win)
      loginUser = loginData.userid // 保存登陆用户的id
      await syncContacts() // 同步联系人数据到本地数据库
      win.setResizable(true)
      // win.setTitleBarOverlay()
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
