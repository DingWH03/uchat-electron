import { getLocalFile, getSecureFileUrl } from '../ipcApi'
import { UserSimpleInfoWithStatus, GroupSimpleInfo } from '@apiType/HttpRespond'

/**
 * 获取文件的安全 URL
 * @param avatarUrl 头像 URL
 * @returns 安全的应用内 URL
 */
export async function getSecureAvatarUrl(avatarUrl: string | null): Promise<string> {
  if (!avatarUrl) {
    return ''
  }

  try {
    const localRes = await getLocalFile(avatarUrl)
    if (localRes.success && localRes.data) {
      const secureRes = await getSecureFileUrl(localRes.data)
      return secureRes.success && secureRes.data ? secureRes.data : ''
    }
  } catch (error) {
    console.error('获取安全头像URL失败:', error)
  }

  return ''
}

/**
 * 批量获取好友头像的安全 URL
 * @param friends 好友列表
 * @returns 更新后的好友列表
 */
export async function getSecureFriendAvatarUrls(
  friends: UserSimpleInfoWithStatus[]
): Promise<UserSimpleInfoWithStatus[]> {
  const updatedFriends = await Promise.all(
    friends.map(async (friend) => {
      if (friend.base.avatar_url) {
        const secureUrl = await getSecureAvatarUrl(friend.base.avatar_url)
        return {
          ...friend,
          base: {
            ...friend.base,
            avatar_url: secureUrl
          }
        }
      }
      return friend
    })
  )

  return updatedFriends
}

/**
 * 批量获取群组头像的安全 URL
 * @param groups 群组列表
 * @returns 更新后的群组列表
 */
export async function getSecureGroupAvatarUrls(
  groups: GroupSimpleInfo[]
): Promise<GroupSimpleInfo[]> {
  const updatedGroups = await Promise.all(
    groups.map(async (group) => {
      if (group.avatar_url) {
        const secureUrl = await getSecureAvatarUrl(group.avatar_url)
        return {
          ...group,
          avatar_url: secureUrl
        }
      }
      return group
    })
  )

  return updatedGroups
}

/**
 * 批量获取多个头像的安全 URL（通用版本）
 * @param items 包含 avatar_url 字段的项目数组
 * @returns 更新后的项目数组
 */
export async function getSecureAvatarUrls<T extends { avatar_url?: string | null }>(
  items: T[]
): Promise<T[]> {
  const updatedItems = await Promise.all(
    items.map(async (item) => {
      if (item.avatar_url) {
        const secureUrl = await getSecureAvatarUrl(item.avatar_url)
        return { ...item, avatar_url: secureUrl }
      }
      return item
    })
  )

  return updatedItems
}
