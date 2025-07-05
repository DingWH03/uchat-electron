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
  GroupSessionMessage,
  GroupSimpleInfo,
  RequestResponse,
  SessionMessage,
  UserDetailedInfo,
  UserSimpleInfo,
  UserSimpleInfoWithStatus
} from 'src/types/HttpRespond'
import { Account, DBResult, Conversation } from '@/types/localDBModel'

// 本地数据库返回的消息结构
interface LocalSessionMessage {
  sender_id: number
  message_type: string
  content: string
  timestamp: number
}

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
      group_messages: (
        requestData: MessageRequest
      ) => Promise<RequestResponse<GroupSessionMessage[]>>
      // ws
      sendMessage: (msg: ClientMessage) => Promise<boolean> // ws发送消息
      removeWebSocketMessageListener: () => void
      onWSStatus: (callback: (status: string) => void) => void // ws状态提示
      onWSMessage: (callback: (msg: ServerMessage) => void) => void // ws接受消息
      onWebSocketMessage: (callback: (message: ServerMessage) => void) => void
      onFriendOnline: (callback: (data: { user_id: number }) => void) => void // 好友上线
      onFriendOffline: (callback: (data: { user_id: number }) => void) => void // 好友下线
      onFriendStatusUpdated: (
        callback: (data: Array<{ user_id: number; online: boolean }>) => void
      ) => void // 好友状态批量更新
      saveMessageToDB: (params: {
        type: 'private' | 'group'
        receiver_id?: number
        group_id?: number
        message: string
        sender_id: number
        timestamp: number
        message_id?: number
      }) => Promise<boolean>
    }
    localDB: {
      addOrUpdateAccount: (Data: Account) => Promise<DBResult<void>>
      getAccounts: () => Promise<DBResult<Account[]>>
      deleteAccount: (accountId: number) => Promise<DBResult<void>>
      group_list: () => Promise<DBResult<GroupSimpleInfo[]>>
      friend_list: () => Promise<DBResult<UserSimpleInfoWithStatus[]>>
      getFriendsWithStatus: () => Promise<
        DBResult<Array<UserSimpleInfo & { online: boolean; lastOnlineTime: number }>>
      >
      getFriendStatus: (
        userId: number
      ) => Promise<DBResult<{ online: boolean; lastOnlineTime: number } | null>>
      getLocalGroupMessages: (
        groupId: number,
        offset: number,
        limit: number
      ) => Promise<LocalSessionMessage[]>
      getLocalPrivateMessages: (
        userId: number,
        offset: number,
        limit: number
      ) => Promise<LocalSessionMessage[]>
      getLocalGroupMessagesAfterTimestamp: (
        groupId: number,
        after: number
      ) => Promise<LocalSessionMessage[]>
      getLocalPrivateMessagesAfterTimestamp: (
        userId: number,
        after: number
      ) => Promise<LocalSessionMessage[]>
      saveMessageToDB: (params: {
        type: 'private' | 'group'
        receiver_id?: number
        group_id?: number
        message: string
        sender_id: number
        timestamp: number
        message_id?: number
      }) => Promise<boolean>
      getConversations: () => Promise<DBResult<Conversation[]>>
      getConversation: (conversationType: string, targetId: number) => Promise<DBResult<Conversation | null>>
      updateConversationUnread: (conversationType: string, targetId: number, unreadCount: number) => Promise<DBResult<boolean>>
      markConversationRead: (conversationType: string, targetId: number) => Promise<DBResult<boolean>>
      deleteConversation: (conversationType: string, targetId: number) => Promise<DBResult<boolean>>
      getConversationCount: () => Promise<DBResult<number>>
      getTotalUnreadCount: () => Promise<DBResult<number>>
    }
  }
}
