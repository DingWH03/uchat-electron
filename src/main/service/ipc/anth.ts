import { RegisterRequest, LoginRequest, PasswordRequest } from '@apiType/HttpRequest'
import { RequestResponse } from '@apiType/HttpRespond'
import { ipcMain } from 'electron'
import {
  performRegister,
  performLogin,
  performLogout,
  performPassword
} from '../api/anthentication'
import { syncContacts } from '../localDB'
import { setSessionId } from '../config'
import { setMyID } from '../config/myID'
import { connectWebSocket, disconnectWebSocket } from '../WebSocket/wsClient'
import { setAppStatus } from '../appStatus'
// import { setupWebSocket } from '../WebSocket/wsClient'

export function registerAuthenticationHandler(): void {
  // 注册账号的后端接口调用
  ipcMain.handle(
    'api:auth/register',
    async (_, registerData: RegisterRequest): Promise<RequestResponse<number>> => {
      return performRegister(registerData)
    }
  )
  // 登陆的后端接口调用
  ipcMain.handle('api:auth/login', async (_, loginData: LoginRequest): Promise<boolean> => {
    const data = await performLogin(loginData)
    if (data.status) {
      setSessionId(data.data ?? null)
      setMyID(loginData.userid) // 保存登陆用户的id
      setAppStatus('online')
      await syncContacts() // 同步联系人数据到本地数据库
      connectWebSocket() // 连接到Websocket
      // win.setTitleBarOverlay()
    } else {
      console.error('[Login] 登录失败')
    }
    return data.status
  })
  // 注销的后端接口调用
  ipcMain.handle('api:auth/logout', async (): Promise<RequestResponse<void>> => {
    const res = await performLogout()
    // console.log(res)
    if (res.status) {
      disconnectWebSocket() // 断开Websocket连接
      setSessionId(null)
      setAppStatus('unlogin')
    }
    return res
  })
  // 修改密码的后端接口调用
  ipcMain.handle(
    'api:auth/password',
    async (_event, requestData: PasswordRequest): Promise<RequestResponse<void>> => {
      return performPassword(requestData)
    }
  )
}
