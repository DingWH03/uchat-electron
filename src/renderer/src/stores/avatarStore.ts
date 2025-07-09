import { ref, reactive } from 'vue'
import { getMe, friend_list } from '../ipcApi'
import { getSecureAvatarUrl } from '../utils/fileUtils'
import { UserSimpleInfoWithStatus } from '@apiType/HttpRespond'

// 头像缓存接口
interface AvatarCache {
  [key: string]: {
    url: string
    timestamp: number
    loading: boolean
  }
}

// 用户信息缓存接口
interface UserInfoCache {
  [userId: number]: {
    username: string
    avatarUrl: string
    timestamp: number
  }
}

export const useAvatarStore = (): {
  avatarCache: AvatarCache
  userInfoCache: UserInfoCache
  currentUser: typeof currentUser
  friendsCache: typeof friendsCache
  initialize: () => Promise<void>
  loadCurrentUser: () => Promise<void>
  loadFriendsList: () => Promise<void>
  getUserAvatar: (userId: number) => string
  getGroupAvatar: (groupId: number) => string
  getCurrentUserAvatar: () => string
  getUsername: (userId: number) => string
  isAvatarLoading: (type: 'user' | 'group', id: number) => boolean
  preloadUserAvatar: (userId: number, avatarUrl?: string) => Promise<void>
  preloadGroupAvatar: (groupId: number, avatarUrl?: string) => Promise<void>
  clearCache: () => void
} => {
  // 头像缓存
  const avatarCache = reactive<AvatarCache>({})

  // 用户信息缓存
  const userInfoCache = reactive<UserInfoCache>({})

  // 当前用户信息
  const currentUser = ref<{
    userId: number
    username: string
    avatarUrl: string
  } | null>(null)

  // 好友列表缓存
  const friendsCache = ref<UserSimpleInfoWithStatus[]>([])

  // 缓存过期时间（24小时）
  const CACHE_EXPIRY = 24 * 60 * 60 * 1000

  /**
   * 获取缓存键
   */
  const getCacheKey = (type: 'user' | 'group', id: number): string => {
    return `${type}-${id}`
  }

  /**
   * 检查缓存是否过期
   */
  const isCacheExpired = (timestamp: number): boolean => {
    return Date.now() - timestamp > CACHE_EXPIRY
  }

  /**
   * 加载当前用户信息
   */
  const loadCurrentUser = async (): Promise<void> => {
    if (currentUser.value) return

    try {
      const myInfo = await getMe()
      if (myInfo.success && myInfo.data) {
        const avatarUrl = myInfo.data.avatar_url
          ? await getSecureAvatarUrl(myInfo.data.avatar_url)
          : ''

        currentUser.value = {
          userId: myInfo.data.user_id,
          username: myInfo.data.username,
          avatarUrl
        }

        // 缓存当前用户头像
        const cacheKey = getCacheKey('user', myInfo.data.user_id)
        avatarCache[cacheKey] = {
          url: avatarUrl,
          timestamp: Date.now(),
          loading: false
        }
      }
    } catch (error) {
      console.error('加载当前用户信息失败:', error)
    }
  }

  /**
   * 加载好友列表
   */
  const loadFriendsList = async (): Promise<void> => {
    try {
      const friends = await friend_list()
      if (friends.success && friends.data) {
        friendsCache.value = friends.data

        // 预加载所有好友头像
        await Promise.all(
          friends.data.map(async (friend) => {
            const cacheKey = getCacheKey('user', friend.base.user_id)

            // 如果缓存不存在或已过期，重新加载
            if (!avatarCache[cacheKey] || isCacheExpired(avatarCache[cacheKey].timestamp)) {
              avatarCache[cacheKey] = {
                url: '',
                timestamp: Date.now(),
                loading: true
              }

              try {
                const secureUrl = friend.base.avatar_url
                  ? await getSecureAvatarUrl(friend.base.avatar_url)
                  : ''

                avatarCache[cacheKey] = {
                  url: secureUrl,
                  timestamp: Date.now(),
                  loading: false
                }
              } catch (error) {
                console.error(`加载用户${friend.base.user_id}头像失败:`, error)
                avatarCache[cacheKey].loading = false
              }
            }
          })
        )
      }
    } catch (error) {
      console.error('加载好友列表失败:', error)
    }
  }

  /**
   * 获取用户头像
   */
  const getUserAvatar = (userId: number): string => {
    const cacheKey = getCacheKey('user', userId)
    return avatarCache[cacheKey]?.url || ''
  }

  /**
   * 获取群组头像
   */
  const getGroupAvatar = (groupId: number): string => {
    const cacheKey = getCacheKey('group', groupId)
    return avatarCache[cacheKey]?.url || ''
  }

  /**
   * 获取当前用户头像
   */
  const getCurrentUserAvatar = (): string => {
    return currentUser.value?.avatarUrl || ''
  }

  /**
   * 获取用户名
   */
  const getUsername = (userId: number): string => {
    // 先检查当前用户
    if (currentUser.value?.userId === userId) {
      return currentUser.value.username
    }

    // 检查好友列表
    const friend = friendsCache.value.find((f) => f.base.user_id === userId)
    return friend ? friend.base.username : `用户${userId}`
  }

  /**
   * 检查头像是否正在加载
   */
  const isAvatarLoading = (type: 'user' | 'group', id: number): boolean => {
    const cacheKey = getCacheKey(type, id)
    return avatarCache[cacheKey]?.loading || false
  }

  /**
   * 预加载用户头像
   */
  const preloadUserAvatar = async (userId: number, avatarUrl?: string): Promise<void> => {
    const cacheKey = getCacheKey('user', userId)

    // 如果缓存存在且未过期，跳过
    if (avatarCache[cacheKey] && !isCacheExpired(avatarCache[cacheKey].timestamp)) {
      return
    }

    avatarCache[cacheKey] = {
      url: '',
      timestamp: Date.now(),
      loading: true
    }

    try {
      const secureUrl = avatarUrl ? await getSecureAvatarUrl(avatarUrl) : ''
      avatarCache[cacheKey] = {
        url: secureUrl,
        timestamp: Date.now(),
        loading: false
      }
    } catch (error) {
      console.error(`预加载用户${userId}头像失败:`, error)
      avatarCache[cacheKey].loading = false
    }
  }

  /**
   * 预加载群组头像
   */
  const preloadGroupAvatar = async (groupId: number, avatarUrl?: string): Promise<void> => {
    const cacheKey = getCacheKey('group', groupId)

    // 如果缓存存在且未过期，跳过
    if (avatarCache[cacheKey] && !isCacheExpired(avatarCache[cacheKey].timestamp)) {
      return
    }

    avatarCache[cacheKey] = {
      url: '',
      timestamp: Date.now(),
      loading: true
    }

    try {
      const secureUrl = avatarUrl ? await getSecureAvatarUrl(avatarUrl) : ''
      avatarCache[cacheKey] = {
        url: secureUrl,
        timestamp: Date.now(),
        loading: false
      }
    } catch (error) {
      console.error(`预加载群组${groupId}头像失败:`, error)
      avatarCache[cacheKey].loading = false
    }
  }

  /**
   * 清除缓存
   */
  const clearCache = (): void => {
    Object.keys(avatarCache).forEach((key) => {
      delete avatarCache[key]
    })
    Object.keys(userInfoCache).forEach((key) => {
      delete userInfoCache[key]
    })
    friendsCache.value = []
    currentUser.value = null
  }

  /**
   * 初始化头像管理
   */
  const initialize = async (): Promise<void> => {
    await Promise.all([loadCurrentUser(), loadFriendsList()])
  }

  return {
    // 状态
    avatarCache,
    userInfoCache,
    currentUser,
    friendsCache,

    // 方法
    initialize,
    loadCurrentUser,
    loadFriendsList,
    getUserAvatar,
    getGroupAvatar,
    getCurrentUserAvatar,
    getUsername,
    isAvatarLoading,
    preloadUserAvatar,
    preloadGroupAvatar,
    clearCache
  }
}

// 创建全局单例
export const avatarStore = useAvatarStore()
