// main/api/baseUrl.ts
import { registerPingApi } from './ping'
import { registerFriendApi } from './friend'
import { registerGroupApi } from './group'
import { registerMessageApi } from './message'

export function Apis(): void {
  registerPingApi()
  registerFriendApi()
  registerGroupApi()
  registerMessageApi()
}
