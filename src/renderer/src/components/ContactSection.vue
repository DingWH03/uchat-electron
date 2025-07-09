<template>
  <div class="contacts-section">
    <div class="section-header">
      <h2>{{ title }}</h2>
      <button class="add-btn" @click="$emit('add-item')">
        <span class="iconfont icon-add"></span>
      </button>
    </div>
    <div v-if="items.length === 0" class="empty">暂无{{ title === '好友' ? '好友' : '群聊' }}</div>
    <ul v-else>
      <li
        v-for="item in items"
        :key="getItemId(item)"
        class="contact-item"
        :class="{ selected: isSelected(item) }"
        @click="$emit('select-item', item)"
      >
        <div class="avatar">
          <el-avatar
            :size="32"
            :src="getItemAvatar(item)"
            :alt="getItemName(item)"
          >
            {{ getItemName(item).charAt(0) }}
          </el-avatar>
        </div>
        <span class="name">{{ getItemName(item) }}</span>
        <span
          v-if="type === 'friend'"
          class="status"
          :class="(item as any).online ? 'online' : 'offline'"
        >
          {{ (item as any).online ? '在线' : '离线' }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { UserSimpleInfoWithStatus, GroupSimpleInfo } from '@apiType/HttpRespond'
import { ElAvatar } from 'element-plus'
import { getSecureAvatarUrl } from '../utils/fileUtils'
import { ref, watch } from 'vue'

interface Props {
  title: string
  items: (UserSimpleInfoWithStatus | GroupSimpleInfo)[]
  type: 'friend' | 'group'
  selectedType: 'friend' | 'group' | ''
  selectedId: number | null
}

const props = defineProps<Props>()

// 头像缓存
const avatarCache = ref<Map<string, string>>(new Map())

const getItemId = (item: UserSimpleInfoWithStatus | GroupSimpleInfo): number => {
  if (props.type === 'friend') {
    return (item as UserSimpleInfoWithStatus).base.user_id
  } else {
    return (item as GroupSimpleInfo).group_id
  }
}

const getItemName = (item: UserSimpleInfoWithStatus | GroupSimpleInfo): string => {
  if (props.type === 'friend') {
    return (item as UserSimpleInfoWithStatus).base.username
  } else {
    return (item as GroupSimpleInfo).title
  }
}

const getItemAvatar = (item: UserSimpleInfoWithStatus | GroupSimpleInfo): string => {
  let avatarUrl = ''
  let cacheKey = ''
  
  if (props.type === 'friend') {
    avatarUrl = (item as UserSimpleInfoWithStatus).base.avatar_url || ''
    cacheKey = `friend-${(item as UserSimpleInfoWithStatus).base.user_id}`
  } else {
    avatarUrl = (item as GroupSimpleInfo).avatar_url || ''
    cacheKey = `group-${(item as GroupSimpleInfo).group_id}`
  }
  
  // 检查缓存
  if (avatarCache.value.has(cacheKey)) {
    return avatarCache.value.get(cacheKey) || ''
  }
  
  // 如果没有头像URL，返回空字符串
  if (!avatarUrl) {
    return ''
  }
  
  // 异步获取安全URL并缓存
  getSecureAvatarUrl(avatarUrl).then(secureUrl => {
    avatarCache.value.set(cacheKey, secureUrl)
  })
  
  return ''
}

const isSelected = (item: UserSimpleInfoWithStatus | GroupSimpleInfo): boolean => {
  return props.selectedType === props.type && props.selectedId === getItemId(item)
}

// 监听items变化，预加载头像
watch(() => props.items, async (newItems) => {
  for (const item of newItems) {
    let avatarUrl = ''
    let cacheKey = ''
    
    if (props.type === 'friend') {
      avatarUrl = (item as UserSimpleInfoWithStatus).base.avatar_url || ''
      cacheKey = `friend-${(item as UserSimpleInfoWithStatus).base.user_id}`
    } else {
      avatarUrl = (item as GroupSimpleInfo).avatar_url || ''
      cacheKey = `group-${(item as GroupSimpleInfo).group_id}`
    }
    
    if (avatarUrl && !avatarCache.value.has(cacheKey)) {
      const secureUrl = await getSecureAvatarUrl(avatarUrl)
      avatarCache.value.set(cacheKey, secureUrl)
    }
  }
}, { immediate: true })
</script>

<style scoped>
.contacts-section {
  padding: 0 18px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h2 {
  font-size: 18px;
  color: #409eff;
  font-weight: bold;
  margin: 0;
}

.add-btn {
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
}

.add-btn:hover {
  background: #307fd6;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-item.selected {
  background: #e6f7ff;
  color: #409eff;
  font-weight: bold;
}

.avatar {
  flex-shrink: 0;
}

.name {
  flex: 1;
}

.status {
  font-size: 13px;
  margin-left: 6px;
}

.online {
  color: #52c41a;
}

.offline {
  color: #bfbfbf;
}

.empty {
  color: #bfbfbf;
  text-align: center;
  padding: 12px 0;
}
</style>
