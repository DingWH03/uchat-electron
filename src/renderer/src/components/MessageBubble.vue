<template>
  <div class="message-row" :class="{ mine: isMine, theirs: !isMine }">
    <div class="avatar-block">
      <div v-if="isGroup && !isMine" class="msg-username">{{ getSenderName() }}</div>
      <div class="avatar">
        <el-avatar
          v-if="!isMine && senderAvatar"
          :size="40"
          :src="senderAvatar"
          :alt="getSenderName()"
        >
          {{ getSenderName().charAt(0) }}
        </el-avatar>
        <el-avatar v-else-if="isMine && myAvatar" :size="40" :src="myAvatar" :alt="getSenderName()">
          {{ getSenderName().charAt(0) }}
        </el-avatar>
        <span v-else>{{ isMine ? '🧑' : '👤' }}</span>
      </div>
    </div>
    <div class="bubble-block">
      <div class="bubble" :class="{ mine: isMine }">{{ msg.message }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElAvatar } from 'element-plus'
import { avatarStore } from '../stores/avatarStore'

interface Props {
  msg: {
    sender_id: number
    message: string
    timestamp: number
  }
  isMine: boolean
  isGroup: boolean
}

const props = defineProps<Props>()

// 使用全局头像管理
const { getUserAvatar, getCurrentUserAvatar, getUsername } = avatarStore

// 计算属性：获取发送者头像
const senderAvatar = computed(() => {
  if (props.isMine) {
    return getCurrentUserAvatar()
  }
  return getUserAvatar(props.msg.sender_id)
})

// 计算属性：获取我的头像
const myAvatar = computed(() => {
  return getCurrentUserAvatar()
})

// 获取发送者姓名
const getSenderName = (): string => {
  if (props.isMine) {
    return '我'
  }

  if (props.isGroup) {
    return getUsername(props.msg.sender_id)
  }

  return '好友'
}
</script>

<style scoped>
.message-row {
  display: flex;
  align-items: flex-end;
  margin-bottom: 18px;
  padding-left: 16px;
  padding-right: 16px;
  width: 100%;
}
.message-row.mine {
  flex-direction: row-reverse;
  justify-content: flex-start;
}
.message-row.theirs {
  justify-content: flex-start;
}
.avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 8px;
  min-width: 48px;
}
.msg-username {
  font-size: 13px;
  color: #8a8a8a;
  margin-bottom: 2px;
  text-align: center;
  word-break: break-all;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e6f7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.bubble-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 70%;
}
.message-row.mine .bubble-block {
  align-items: flex-end;
}
.bubble {
  background: #fff;
  border-radius: 16px;
  padding: 12px 18px;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  position: relative;
  min-width: 36px;
  max-width: 100%;
  margin: 0 2px;
}
.bubble.mine {
  background: #e6f7ff;
}
</style>
