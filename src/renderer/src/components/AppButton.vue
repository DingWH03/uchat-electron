<template>
  <button :class="['app-button', type]" @click="$emit('click')">
    <span v-if="icon" class="icon">{{ icon }}</span>
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  type?: 'primary' | 'danger' | 'default'
  icon?: string
}>()
defineEmits(['click'])
</script>

<style scoped>
.app-button {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.07);
  font-weight: 500;
  outline: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.default {
  background: linear-gradient(90deg, #f8f8f8 0%, #ececec 100%);
  color: #333;
}

.primary {
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.13);
}

.danger {
  background: linear-gradient(90deg, #f56c6c 0%, #ff9292 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.13);
}

.app-button:hover {
  filter: brightness(1.08);
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.18);
}

.app-button:active {
  filter: brightness(0.97);
  transform: scale(0.98);
}

.icon {
  margin-right: 6px;
  font-size: 1.1em;
  display: flex;
  align-items: center;
}
</style>
