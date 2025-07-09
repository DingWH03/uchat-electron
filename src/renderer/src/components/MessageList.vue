<template>
  <div 
    ref="messageContainer" 
    class="message-list-container"
    @scroll="handleScroll"
  >
    <div class="message-list">
      <div 
        v-for="(message, index) in visibleMessages" 
        :key="`${message.sender_id}-${message.timestamp}-${index}`"
        :id="getMsgDomId(message, index)"
        class="message-item"
      >
        <MessageBubble
          :msg="message"
          :is-mine="message.sender_id === myId"
          :is-group="isGroup"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ElButton } from 'element-plus'
import MessageBubble from './MessageBubble.vue'
import { SessionMessage } from '@apiType/HttpRespond'

interface Props {
  messages: SessionMessage[]
  myId: number
  isGroup: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// 虚拟滚动相关
const messageContainer = ref<HTMLElement | null>(null)
const containerHeight = ref(0)
const scrollTop = ref(0)
const loadingMore = ref(false)
const atBottom = ref(true) // 是否在底部

// 每页显示的消息数量
const PAGE_SIZE = 20
const currentPage = ref(1)

// 计算可见消息（最新的currentPage*PAGE_SIZE条，从后往前取）
const visibleMessages = computed(() => {
  const total = props.messages.length
  const count = currentPage.value * PAGE_SIZE
  const start = Math.max(0, total - count)
  return props.messages.slice(start, total)
})

// 检查是否还有更多消息
const hasMoreMessages = computed(() => {
  return visibleMessages.value.length < props.messages.length
})

// 处理滚动事件
const handleScroll = (event: Event): void => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  // 判断是否在底部
  atBottom.value = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 2
  // 如果滚动到顶部，自动加载更多消息
  if (target.scrollTop === 0 && hasMoreMessages.value && !loadingMore.value) {
    loadMoreMessages()
  }
}

// 生成每条消息的唯一dom id
function getMsgDomId(msg: SessionMessage, index: number) {
  return `msg-${msg.sender_id}-${msg.timestamp}-${index}`
}

// 平滑加载更多消息（锚点法，修正版）
const loadMoreMessages = async (): Promise<void> => {
  if (loadingMore.value) return
  loadingMore.value = true

  // 记录加载前第一个可见消息的唯一key和其offsetTop
  const firstMsg = visibleMessages.value[0]
  let anchorKey = ''
  let anchorOffset = 0
  if (firstMsg) {
    anchorKey = `${firstMsg.sender_id}-${firstMsg.timestamp}`
    const anchorEl = document.getElementById(getMsgDomId(firstMsg, 0))
    if (anchorEl && messageContainer.value) {
      anchorOffset = anchorEl.getBoundingClientRect().top - messageContainer.value.getBoundingClientRect().top
    }
  }

  currentPage.value++
  await nextTick()

  // 加载后找到同一条消息在新visibleMessages中的index，生成新id
  if (anchorKey && messageContainer.value) {
    const newIndex = visibleMessages.value.findIndex(
      m => `${m.sender_id}-${m.timestamp}` === anchorKey
    )
    if (newIndex !== -1) {
      const anchorEl = document.getElementById(getMsgDomId(visibleMessages.value[newIndex], newIndex))
      if (anchorEl) {
        const newOffset = anchorEl.getBoundingClientRect().top - messageContainer.value.getBoundingClientRect().top
        messageContainer.value.scrollTop += (newOffset - anchorOffset)
      }
    }
  }
  loadingMore.value = false
}

// 滚动到底部
const scrollToBottom = (): void => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

// 监听消息变化，只有在底部时才自动滚动到底部
watch(() => props.messages.length, (newLength, oldLength) => {
  if (newLength > oldLength && atBottom.value) {
    scrollToBottom()
  }
}, { flush: 'post' })

// 监听消息内容变化
watch(() => props.messages, () => {
  // 重置分页，显示最新的20条
  currentPage.value = 1
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

onMounted(() => {
  // 初始化容器高度
  if (messageContainer.value) {
    containerHeight.value = messageContainer.value.clientHeight
  }
  // 初始滚动到底部
  scrollToBottom()
})

// 暴露方法给父组件
defineExpose({
  scrollToBottom,
  loadMoreMessages
})
</script>

<style scoped>
.message-list-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  background: #f7faff;
}

.message-list {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.message-item {
  width: 100%;
}

.load-more-container {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  padding: 8px;
  background: rgba(247, 250, 255, 0.9);
  backdrop-filter: blur(4px);
}

/* 自定义滚动条样式 */
.message-list-container::-webkit-scrollbar {
  width: 6px;
}

.message-list-container::-webkit-scrollbar-track {
  background: transparent;
}

.message-list-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.message-list-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style> 