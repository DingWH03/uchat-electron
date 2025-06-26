// main/api/baseUrl.ts
import { BrowserWindow } from 'electron'
import { registerPingApi } from './ping'
import { registerAnthenticationApi } from './anthentication'
import { registerFriendApi } from './friend'
import { registerGroupApi } from './group'
import { registerMessageApi } from './message'

export function Apis(win: BrowserWindow): void {
  registerPingApi()
  registerAnthenticationApi(win)
  registerFriendApi()
  registerGroupApi()
  registerMessageApi()
}
