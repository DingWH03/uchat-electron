<template>
  <div class="conversation-list-panel">
    <div class="conversation-header">
      <h3>会话</h3>
      <el-button type="primary" size="small" :loading="loading" @click="refreshConversations">
        刷新
      </el-button>
    </div>

    <div class="conversation-list">
      <div
        v-for="conversation in conversations"
        :key="`${conversation.conversation_type}-${conversation.target_id}`"
        class="conversation-item"
        :class="{
          selected:
            selectedType === conversation.conversation_type &&
            selectedId === conversation.target_id,
          unread: conversation.unread_count > 0
        }"
        @click="handleSelectConversation(conversation)"
      >
        <div class="avatar">
          <el-avatar
            :size="40"
            :src="conversation.target_avatar || undefined"
            :alt="conversation.target_name"
          >
            {{ conversation.target_name.charAt(0) }}
          </el-avatar>
          <div v-if="conversation.unread_count > 0" class="unread-badge">
            {{ conversation.unread_count > 99 ? '99+' : conversation.unread_count }}
          </div>
        </div>

        <div class="conversation-info">
          <div class="conversation-header">
            <span class="name">{{ conversation.target_name }}</span>
            <span class="time">{{ formatTime(conversation.last_message_timestamp) }}</span>
          </div>
          <div class="conversation-content">
            <span class="last-message">{{ conversation.last_message_content }}</span>
            <el-tag
              :type="conversation.conversation_type === 'friend' ? 'primary' : 'success'"
              size="small"
            >
              {{ conversation.conversation_type === 'friend' ? '好友' : '群聊' }}
            </el-tag>
          </div>
        </div>
      </div>

      <div v-if="conversations.length === 0" class="empty-state">
        <el-empty description="暂无会话" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { ElButton, ElAvatar, ElTag, ElEmpty } from 'element-plus'
import { getConversations, getConversation } from '../ipcApi'
import type { Conversation } from '@apiType/localDBModel'

interface Props {
  selectedType: string
  selectedId: number | null
}

interface Emits {
  (e: 'select-conversation', conversation: Conversation): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const conversations = ref<Conversation[]>([])
const loading = ref(false)
const lastUpdateTime = ref<number>(0)

const loadConversations = async (): Promise<void> => {
  loading.value = true
  try {
    const result = await getConversations()
    if (result.success) {
      conversations.value = result.data
      lastUpdateTime.value = Date.now()
    }
  } catch (error) {
    console.error('获取会话列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 局部刷新：只更新指定的会话
const updateConversation = async (conversationType: string, targetId: number): Promise<void> => {
  try {
    // 使用单条会话查询，提高效率
    const result = await getConversation(conversationType, targetId)
    if (result.success && result.data) {
      const updatedConversation = result.data

      // 找到当前列表中的对应会话
      const index = conversations.value.findIndex(
        (c) => c.conversation_type === conversationType && c.target_id === targetId
      )

      if (index !== -1) {
        // 更新现有会话
        conversations.value[index] = updatedConversation
      } else {
        // 添加新会话到列表顶部
        conversations.value.unshift(updatedConversation)
      }

      // 重新排序（按最后消息时间）
      conversations.value.sort((a, b) => b.last_message_timestamp - a.last_message_timestamp)
    }
  } catch (error) {
    console.error('更新会话失败:', error)
  }
}

// 增量刷新：只获取上次更新后的新数据
const incrementalRefresh = async (): Promise<void> => {
  try {
    const result = await getConversations()
    if (result.success) {
      const newConversations = result.data

      // 比较新旧数据，只更新有变化的会话
      const updatedConversations: Conversation[] = []
      const newConversationMap = new Map(
        newConversations.map((c) => [`${c.conversation_type}-${c.target_id}`, c])
      )

      // 检查现有会话是否有更新
      conversations.value.forEach((conversation) => {
        const key = `${conversation.conversation_type}-${conversation.target_id}`
        const newConversation = newConversationMap.get(key)

        if (newConversation) {
          // 检查是否有变化
          if (
            newConversation.last_message_content !== conversation.last_message_content ||
            newConversation.last_message_timestamp !== conversation.last_message_timestamp ||
            newConversation.unread_count !== conversation.unread_count
          ) {
            updatedConversations.push(newConversation)
          } else {
            updatedConversations.push(conversation)
          }
          newConversationMap.delete(key)
        }
      })

      // 添加新的会话
      newConversationMap.forEach((conversation) => {
        updatedConversations.push(conversation)
      })

      // 重新排序
      updatedConversations.sort((a, b) => b.last_message_timestamp - a.last_message_timestamp)

      // 使用 nextTick 确保 DOM 更新平滑
      await nextTick()
      conversations.value = updatedConversations
      lastUpdateTime.value = Date.now()
    }
  } catch (error) {
    console.error('增量刷新失败:', error)
  }
}

const refreshConversations = (): void => {
  loadConversations()
}

// 暴露方法给父组件
defineExpose({
  refreshConversations,
  updateConversation,
  incrementalRefresh
})

const handleSelectConversation = (conversation: Conversation): void => {
  emit('select-conversation', conversation)
}

const formatTime = (timestamp: number): string => {
  const now = new Date()
  const messageTime = new Date(timestamp * 1000)
  const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return messageTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffInHours < 48) {
    return '昨天'
  } else {
    return messageTime.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}

watch(
  () => [props.selectedType, props.selectedId],
  () => {
    loadConversations()
  }
)

onMounted(() => {
  loadConversations()
})
</script>

<style scoped>
.conversation-list-panel {
  width: 300px;
  min-width: 220px;
  background: #fff;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.conversation-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conversation-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.conversation-item:hover {
  background-color: #f5f5f5;
}

.conversation-item.selected {
  background-color: #e6f7ff;
  border-right: 3px solid #1890ff;
}

.conversation-item.unread {
  background-color: #f0f9ff;
}

.avatar {
  position: relative;
  margin-right: 12px;
}

.unread-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #ff4d4f;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 10px;
  min-width: 16px;
  text-align: center;
  line-height: 1;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.conversation-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style>
