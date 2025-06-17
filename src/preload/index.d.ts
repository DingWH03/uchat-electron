import { ElectronAPI } from '@electron-toolkit/preload'
import {
  RegisterRequest,
  LoginRequest,
  MessageRequest,
  FriendRequest,
  PasswordRequest,
  GroupRequest,
  CreateGroupRequest
} from '../types/HttpRequest'
import { ClientMessage } from 'src/types/WebsocketRequest'
import { ServerMessage } from 'src/types/WebsocketRespond'
import { ServerResponse } from 'src/types/HttpRespond'
import { Account, DBResult } from '@/types/localDBModel'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      ping: () => Promise<string>
      setBaseUrl: (URL: string) => Promise<boolean>
      // auth
      register: (registerData: RegisterRequest) => Promise<ServerResponse>
      login: (loginData: LoginRequest) => Promise<boolean>
      logout: () => Promise<ServerResponse>
      password: (requestData: PasswordRequest) => Promise<ServerResponse>
      myid: () => number
      // friend
      friend_add: (requestData: FriendRequest) => Promise<ServerResponse>
      friend_list: () => Promise<ServerResponse>
      friend_list_v2: () => Promise<ServerResponse>
      friend_info: (requestData: FriendRequest) => Promise<ServerResponse>
      // group
      group_list: () => Promise<ServerResponse>
      group_info: (requestData: GroupRequest) => Promise<ServerResponse>
      group_members: (requestData: GroupRequest) => Promise<ServerResponse>
      group_new: (requestData: CreateGroupRequest) => Promise<ServerResponse>
      group_join: (requestData: GroupRequest) => Promise<ServerResponse>
      group_leave: (requestData: GroupRequest) => Promise<ServerResponse>
      // message
      friend_messages: (requestData: MessageRequest) => Promise<ServerRespond>
      group_messages: (requestData: MessageRequest) => Promise<ServerRespond>
      // ws
      sendMessage: (msg: ClientMessage) => Promise<boolean> // ws发送消息
      onWSStatus: (callback: (status: string) => void) => void // ws状态提示
      onWSMessage: (callback: (msg: ServerMessage) => void) => void // ws接受消息
    }
    localDB: {
      addOrUpdateAccount: (Data: Account) => Promise<DBResult<void>>
      getAccounts: () => Promise<DBResult<Account[]>>
    }
  }
}
