<template>
  <div class="message-row" :class="{ mine: isMine, theirs: !isMine }">
    <div class="avatar-block">
      <div v-if="isGroup && !isMine" class="msg-username">{{ msg.sender_id }}</div>
      <div class="avatar">
        <span v-if="isMine">🧑</span>
        <span v-else>👤</span>
      </div>
    </div>
    <div class="bubble-block">
      <div class="bubble" :class="{ mine: isMine }">{{ msg.message }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps({
  msg: { type: Object, required: true },
  isMine: { type: Boolean, required: true },
  isGroup: { type: Boolean, required: true }
})
// console.log('MessageBubble props:', props)
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
