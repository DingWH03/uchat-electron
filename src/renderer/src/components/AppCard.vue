<template>
  <div class="app-card">
    <h2 v-if="title" class="card-title">{{ title }}</h2>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<style scoped>
.app-card {
  border: none;
  border-radius: 16px;
  padding: 28px 28px 20px 28px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}
.app-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.13);
}
.card-title {
  margin-bottom: 18px;
  font-size: 1.25rem;
  font-weight: bold;
  color: #409eff;
  letter-spacing: 1px;
}
</style>
