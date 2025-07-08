import { ElectronAPI } from '@electron-toolkit/preload'
import {
  RegisterRequest,
  LoginRequest,
  FriendRequest,
  PasswordRequest,
  GroupRequest,
  CreateGroupRequest
} from '../types/HttpRequest'
import { ClientMessage } from '@apiType/WebsocketRequest'
import { ServerMessage } from '@apiType/WebsocketRespond'
import {
  GroupDetailedInfo,
  GroupSimpleInfo,
  UserDetailedInfo,
  UserSimpleInfo,
  UserSimpleInfoWithStatus
} from '@apiType/HttpRespond'
import { Account, ApiResponse, Conversation } from '@apiType/localDBModel'
import { LocalSessionMessage } from '@apiType/Model'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      ping: () => Promise<ApiResponse<void>>
      setBaseUrl: (URL: string) => Promise<boolean>
      getBaseUrl: () => Promise<string>
      // account
      addOrUpdateAccount: (Data: Account) => Promise<ApiResponse<void>>
      getAccounts: () => Promise<ApiResponse<Account[]>>
      deleteAccount: (accountId: number) => Promise<ApiResponse<void>>
      // auth
      register: (registerData: RegisterRequest) => Promise<ApiResponse<number>>
      login: (loginData: LoginRequest) => Promise<boolean>
      logout: () => Promise<ApiResponse<void>>
      password: (requestData: PasswordRequest) => Promise<ApiResponse<void>>
      myid: () => number
      // user
      uploadAvatar: (file: File) => Promise<ApiResponse<string>>
      getMe: () => Promise<ApiResponse<UserDetailedInfo>>
      updateMe: (data: UpdateUserRequest) => Promise<ApiResponse<void>>
      patchMe: (data: PatchUserRequest) => Promise<ApiResponse<void>>
      deleteMe: () => Promise<ApiResponse<void>>
      // contact
      group_list: () => Promise<ApiResponse<GroupSimpleInfo[]>>
      friend_list: () => Promise<ApiResponse<UserSimpleInfoWithStatus[]>>
      getFriendsWithStatus: () => Promise<
        ApiResponse<Array<UserSimpleInfo & { online: boolean; lastOnlineTime: number }>>
      >
      getFriendStatus: (
        userId: number
      ) => Promise<ApiResponse<{ online: boolean; lastOnlineTime: number } | null>>
      // friend
      friend_add: (requestData: FriendRequest) => Promise<ApiResponse<void>>
      friend_info: (requestData: FriendRequest) => Promise<ApiResponse<UserDetailedInfo>>
      // group
      group_info: (requestData: GroupRequest) => Promise<ApiResponse<GroupDetailedInfo>>
      group_members: (requestData: GroupRequest) => Promise<ApiResponse<UserSimpleInfo[]>>
      group_new: (requestData: CreateGroupRequest) => Promise<ApiResponse<number>>
      group_join: (requestData: GroupRequest) => Promise<ApiResponse<void>>
      group_leave: (requestData: GroupRequest) => Promise<ApiResponse<void>>
      // message
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
      // conversation
      getConversations: () => Promise<ApiResponse<Conversation[]>>
      getConversation: (
        conversationType: string,
        targetId: number
      ) => Promise<ApiResponse<Conversation | null>>
      updateConversationUnread: (
        conversationType: string,
        targetId: number,
        unreadCount: number
      ) => Promise<ApiResponse<boolean>>
      markConversationRead: (
        conversationType: string,
        targetId: number
      ) => Promise<ApiResponse<boolean>>
      deleteConversation: (
        conversationType: string,
        targetId: number
      ) => Promise<ApiResponse<boolean>>
      getConversationCount: () => Promise<ApiResponse<number>>
      getTotalUnreadCount: () => Promise<ApiResponse<number>>
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
  }
}
