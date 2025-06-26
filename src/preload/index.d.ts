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
import {
  GroupDetailedInfo,
  GroupSimpleInfo,
  RequestResponse,
  SessionMessage,
  UserDetailedInfo,
  UserSimpleInfo,
  UserSimpleInfoWithStatus
} from 'src/types/HttpRespond'
import { Account, DBResult } from '@/types/localDBModel'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      ping: () => Promise<string>
      setBaseUrl: (URL: string) => Promise<boolean>
      getBaseUrl: () => Promise<string>
      // auth
      register: (registerData: RegisterRequest) => Promise<RequestResponse<number>>
      login: (loginData: LoginRequest) => Promise<boolean>
      logout: () => Promise<RequestResponse<void>>
      password: (requestData: PasswordRequest) => Promise<RequestResponse<void>>
      myid: () => number
      // friend
      friend_add: (requestData: FriendRequest) => Promise<RequestResponse<void>>
      friend_list: () => Promise<RequestResponse<UserSimpleInfo[]>>
      friend_list_v2: () => Promise<RequestResponse<UserSimpleInfoWithStatus[]>>
      friend_info: (requestData: FriendRequest) => Promise<RequestResponse<UserDetailedInfo>>
      // group
      group_list: () => Promise<RequestResponse<GroupSimpleInfo[]>>
      group_info: (requestData: GroupRequest) => Promise<RequestResponse<GroupDetailedInfo>>
      group_members: (requestData: GroupRequest) => Promise<RequestResponse<UserSimpleInfo[]>>
      group_new: (requestData: CreateGroupRequest) => Promise<RequestResponse<number>>
      group_join: (requestData: GroupRequest) => Promise<RequestResponse<void>>
      group_leave: (requestData: GroupRequest) => Promise<RequestResponse<void>>
      // message
      friend_messages: (requestData: MessageRequest) => Promise<RequestResponse<SessionMessage[]>>
      group_messages: (requestData: MessageRequest) => Promise<RequestResponse<SessionMessage[]>>
      // ws
      sendMessage: (msg: ClientMessage) => Promise<boolean> // ws发送消息
      onWSStatus: (callback: (status: string) => void) => void // ws状态提示
      onWSMessage: (callback: (msg: ServerMessage) => void) => void // ws接受消息
    }
    localDB: {
      addOrUpdateAccount: (Data: Account) => Promise<DBResult<void>>
      getAccounts: () => Promise<DBResult<Account[]>>
      deleteAccount: (accountId: number) => Promise<DBResult<void>>
    }
  }
}
