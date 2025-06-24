<template>
  <div class="main-content">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 这里可以扩展全局消息、弹窗等
</script>

<style scoped>
.main-content {
  flex: 1;
  min-width: 0;
  /* height: 100%; */
  overflow: auto;
  background: #f7faff;
  padding: 0;
  box-sizing: border-box;
}
@media (max-width: 700px) {
  .main-content {
    padding: 0;
  }
}
</style> 